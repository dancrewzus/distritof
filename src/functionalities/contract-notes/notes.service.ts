import { Injectable, NotFoundException, NotAcceptableException, ConflictException } from '@nestjs/common'
import { Model, PaginateModel, PaginateOptions } from 'mongoose'
import { ConfigService } from '@nestjs/config'
import { InjectModel } from '@nestjs/mongoose'

import { HandleErrors } from 'src/common/utils/handleErrors.util'
import { Contract } from '../contracts/entities/contracts.entity'
import { DayJSAdapter } from 'src/common/adapters/dayjs.adapter'
import { Company } from '../companies/entities/company.entity'
import { error } from 'src/common/constants/error-messages'
import { Track } from '../tracks/entities/track.entity'
import { ContractNote } from './entities/note.entity'
import { CreateNoteDto, UpdateNoteDto } from './dto'
import { User } from '../users/entities/user.entity'
import { Utils } from 'src/common/utils/utils'

@Injectable()
export class NotesService {

  private defaultLimit: number;

  constructor(
    @InjectModel(ContractNote.name, 'default') private readonly noteModel: PaginateModel<ContractNote>,
    @InjectModel(Contract.name, 'default') private readonly contractModel: Model<Contract>,
    @InjectModel(Company.name, 'default') private readonly companyModel: Model<Company>,
    @InjectModel(Track.name, 'default') private readonly trackModel: Model<Track>,
    private readonly configService: ConfigService,
    private readonly handleErrors: HandleErrors,
    private readonly dayjsAdapter: DayJSAdapter,
    private readonly utils: Utils,
  ) {
    this.defaultLimit = this.configService.get<number>('defaultLimit')
  }

  private buildQuery(filter: string, companyId: string, isAdmin: boolean): any {
    const baseQuery = { deleted: false };
    if (!isAdmin) {
      baseQuery['isActive'] = true;
    }
    
    baseQuery['company'] = companyId;
  
    if (filter) {
      return {
        ...baseQuery,
        $or: [
          { name: new RegExp(filter, 'i') },
        ],
      };
    }
  
    return baseQuery;
  }
  
  private buildOptions(offset: number, limit: number, isAdmin: boolean): PaginateOptions {
    const options: PaginateOptions = {
      offset,
      limit,
      sort: { 
        createdAt: 1,
        isActive: -1,
        name: 1
      },
      customLabels: {
        meta: 'pagination',
      },
      populate: [
        {
          path: 'company country routes'
        }
      ]
    };
    return options;
  }

  /**
   * Finds an note by its ID. This method searches for the note in the database using its ID.
   * If the note is not found, it throws a NotFoundException. If an error occurs during the process,
   * it is handled by the handleExceptions method.
   *
   * @private
   * @async
   * @function findNote
   * @param {string} id - The ID of the note to find.
   * @returns {Promise<Note>} A promise that resolves to the note object if found.
   * @throws {NotFoundException} Throws this exception if the note with the specified ID is not found.
   */
  private findNote = async (id: string): Promise<ContractNote> => {
    try {
      const note = await this.noteModel.findById(id)

      if(!note) {
        throw new NotFoundException(`Note with ID "${ id }" not found`)
      }
      return note
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }

  /**
   * Formats the return data for an note. This method structures the note data to be returned,
   * including the ID, code, name, and format. It only returns the data if the note is active.
   *
   * @private
   * @function formatReturnData
   * @param {Note} note - The note object to format.
   * @returns {object} An object containing the formatted note data, or undefined if the note is not active.
   */
  private formatReturnData = (note: ContractNote): object => {
    return {
      id: note?.id,
      createdBy: `${ note?.createdBy.firstName } ${ note?.createdBy.paternalSurname }` || null,
      description: note?.description || '',
      createdAt: note?.createdAt || '',
    }
  }
  
  /**
   * Creates a new note. This method takes a DTO for creating an note, the user requesting the
   * creation, and the client's IP address. It saves the new note in the database and logs the creation
   * event in the tracking model. If an error occurs, it is handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function create
   * @param {CreateNoteDto} createNoteDto - Data Transfer Object containing details for the new note.
   * @param {User} userRequest - The user who requested the creation.
   * @param {string} clientIp - The IP address of the client making the request.
   * @returns {Promise<any>} A promise that resolves to the formatted data of the created note.
   * @throws {Exception} Throws an exception if an error occurs during the creation process.
   */
  public create = async (
    createNoteDto: CreateNoteDto,
    userRequest: User,
    clientIp: string,
  ): Promise<any> => {
    try {
      const { description, contract } = createNoteDto;
      
      const contractResponse = await this.contractModel.findById(contract).populate('notes')
      if(!contractResponse) {
        throw new NotFoundException(error.CONTRACT_NOT_FOUND)
      }

      const createdNote = await this.noteModel.create({
        description,
        contract: contractResponse._id,
        createdBy: userRequest.id,
        createdAt: this.dayjsAdapter.getCurrentDateTime(),
        updatedAt: this.dayjsAdapter.getCurrentDateTime(),
      })

      contractResponse.notes.push(createdNote.id)
      
      await Promise.all([
        contractResponse.save(),
        this.trackModel.create({
          ip: clientIp,
          description: `Note for contract ${ contractResponse._id } was created.`,
          module: 'Notes',
          createdAt: this.dayjsAdapter.getCurrentDateTime(),
          user: userRequest.id
        }),
      ])
      
      return
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Finds multiple notes with pagination and optional filtering. This method retrieves notes
   * based on pagination and filter criteria. It structures the response to include pagination details and
   * the filtered list of notes. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function findMany
   * @param {any} paginationDto - Data Transfer Object for pagination and filtering.
   * @returns {Promise<object>} A promise that resolves to an object containing pagination details and the filtered notes.
   * @throws {Exception} Throws an exception if an error occurs during the retrieval process.
   */
  public findMany = async (paginationDto: any = {}, companyId: string, userRequest: User) => {
    const isAdmin = ['root', 'admin', 'companyOwner', 'companyAdmin', 'companySupervisor'].includes(userRequest?.role?.name);
    const { limit = this.defaultLimit, offset = 0, filter = '' } = paginationDto && !this.utils.isEmptyObject(paginationDto) ? JSON.parse(paginationDto) : {};
    
    try {
      const query = this.buildQuery(filter, companyId, isAdmin);
      const options = this.buildOptions(offset, limit, isAdmin);
  
      const notesResponse = await this.noteModel.paginate(query, options);
      
      return {
        data: {
          pagination: notesResponse?.pagination || {},
          notes: notesResponse?.docs.map((note) => this.formatReturnData(note)),
        }
      };
    } catch (error) {
      this.handleErrors.handleExceptions(error);
    }
  }

  /**
   * Finds multiple notes with pagination and optional filtering. This method retrieves notes
   * based on pagination and filter criteria. It structures the response to include pagination details and
   * the filtered list of notes. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function findForRegister
   * @returns {Promise<object>} A promise that resolves to an object containing pagination details and the filtered notes.
   * @throws {Exception} Throws an exception if an error occurs during the retrieval process.
   */
  public findForRegister = async (contractId: string) => {
    try {

      const contractResponse = await this.contractModel.findById(contractId)
      if(!contractResponse) {
        throw new NotFoundException(error.CONTRACT_NOT_FOUND)
      }

      const notesResponse = await this.noteModel.find({
        deleted: false,
        contract: contractResponse._id,
      }).sort({ createdAt: 1 })

      return {
        data: {
          notes: notesResponse?.map((note) => this.formatReturnData(note))
        }
      }
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Finds a single note by its ID. This method uses the findNote method to retrieve the note
   * and then formats the data using formatReturnData. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function findOne
   * @param {string} id - The ID of the note to find.
   * @returns {Promise<object>} A promise that resolves to the formatted note data.
   * @throws {Exception} Throws an exception if an error occurs during the retrieval process.
   */
  public findOne = async (id: string): Promise<object> => {
    try {
      const note = await this.findNote(id)
      return this.formatReturnData(note)
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Updates an existing note. This method finds the note by its ID, updates it with the provided
   * data, logs the update event, and returns the updated note data. If the note is not found, it
   * throws a NotFoundException. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function update
   * @param {string} id - The ID of the note to update.
   * @param {UpdateNoteDto} updateNoteDto - Data Transfer Object containing the updated details for the note.
   * @param {User} userRequest - The user who requested the update.
   * @param {string} clientIp - The IP address of the client making the request.
   * @returns {Promise<object>} A promise that resolves to the updated note data.
   * @throws {NotFoundException} Throws this exception if the note with the specified ID is not found.
   * @throws {Exception} Throws an exception if an error occurs during the update process.
   */
  public update = async (noteId: string, updateNoteDto: UpdateNoteDto, userRequest: User, clientIp: string): Promise<object> => {
    try {
      const noteResponse = await this.noteModel.findById(noteId).populate('contract')
      if(!noteResponse) {
        throw new NotFoundException(error.NOTE_NOT_FOUND)
      }

      await noteResponse.updateOne({
        ...updateNoteDto,
        updatedAt: this.dayjsAdapter.getCurrentDateTime(),
      })

      await this.trackModel.create({
        ip: clientIp,
        description: `Note ${ noteResponse._id } was updated: ${ JSON.stringify(updateNoteDto) }.`,
        module: 'Notes',
        createdAt: this.dayjsAdapter.getCurrentDateTime(),
        user: userRequest.id
      })
      return
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
  
  /**
   * Deactivates an note by its ID. This method updates the note's status to inactive, logs the
   * deactivation event, and does not return any data. If the note is not found, it throws a NotFoundException.
   * Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function remove
   * @param {string} id - The ID of the note to deactivate.
   * @param {User} userRequest - The user who requested the deactivation.
   * @param {string} clientIp - The IP address of the client making the request.
   * @returns {Promise<void>} A promise that resolves when the deactivation process is complete.
   * @throws {NotFoundException} Throws this exception if the note with the specified ID is not found.
   * @throws {Exception} Throws an exception if an error occurs during the deactivation process.
   */
  public remove = async (noteId: string, userRequest: User, clientIp: string) => {
    try {
      const noteResponse = await this.noteModel.findById(noteId).populate('contract')
      if(!noteResponse) {
        throw new NotFoundException(error.NOTE_NOT_FOUND)
      }
      const { contract } = noteResponse

      await Promise.all([
        noteResponse.updateOne({
          isActive: false,
          deleted: true,
          updatedAt: this.dayjsAdapter.getCurrentDateTime(),
          deletedAt: this.dayjsAdapter.getCurrentDateTime()
        }),
        this.contractModel.updateOne(
          { _id: contract._id },
          { $pull: { notes: noteResponse._id } }
        ),
        this.trackModel.create({
          ip: clientIp,
          description: `Note ${ noteResponse.id } was deactivated.`,
          module: 'Notes',
          createdAt: this.dayjsAdapter.getCurrentDateTime(),
          user: userRequest.id
        }),
      ])

      return
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
}
