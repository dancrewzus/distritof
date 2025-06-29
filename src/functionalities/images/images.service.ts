import { Injectable, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectModel } from '@nestjs/mongoose'
import { Model, PaginateModel, PaginateOptions } from 'mongoose'

import { HandleErrors } from '../../common/utils/handleErrors.util'
import { DayJSAdapter } from 'src/common/adapters/dayjs.adapter'
import { CloudAdapter } from 'src/common/adapters/cloud.adapter'
import { error } from 'src/common/constants/error-messages'
import { CreateImageDto } from './dto/create-image.dto'
import { Track } from '../tracks/entities/track.entity'
import { User } from '../users/entities/user.entity'
import { Image } from './entities/image.entity'

@Injectable()
export class ImagesService {

  private defaultLimit: number;

  constructor(
    @InjectModel(Image.name, 'default') private readonly imageModel: PaginateModel<Image>,
    @InjectModel(Track.name, 'default') private readonly trackModel: Model<Track>,
    private readonly configService: ConfigService,
    private readonly handleErrors: HandleErrors,
    private readonly cloudAdapter: CloudAdapter,
    private readonly dayjsAdapter: DayJSAdapter,
  ) {
    this.defaultLimit = this.configService.get<number>('defaultLimit')
  }

  /**
   * Finds an image by its ID. This method searches for the image in the database using its ID.
   * If the image is not found, it throws a NotFoundException. If an error occurs during the process,
   * it is handled by the handleExceptions method.
   *
   * @private
   * @async
   * @function findImage
   * @param {string} id - The ID of the image to find.
   * @returns {Promise<Image>} A promise that resolves to the image object if found.
   * @throws {NotFoundException} Throws this exception if the image with the specified ID is not found.
   */
  private findImage = async (id: string): Promise<Image> => {
    try {
      const image = await this.imageModel.findById(id)

      if(!image) {
        throw new NotFoundException(`Image with ID "${ id }" not found`)
      }
      return image
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }

  /**
   * Formats the return data for an image. This method structures the image data to be returned,
   * including the ID, code, name, and format. It only returns the data if the image is active.
   *
   * @private
   * @function formatReturnData
   * @param {Image} image - The image object to format.
   * @returns {object} An object containing the formatted image data, or undefined if the image is not active.
   */
  private formatReturnData = (image: Image) => { 
    return {
      id: image.id || '',
      imageUrl: image.imageUrl || '',
      publicId: image.publicId || '',
      folder: image.folder || '',
      format: image.format || '',
      bytes: image.bytes || 0,
      width: image.width || 0,
      height: image.height || 0,
    }
  }

  /**
   * Creates a new image record in the database after uploading the image to a cloud storage service. This function
   * takes an image in base64 format and a type from the CreateImageDto, uploads the image to the cloud via the cloudAdapter,
   * and then creates a new record in the imageModel with the response from the cloud storage and metadata including the
   * creator's ID and timestamps. The created image data is then formatted and returned.
   *
   * @public
   * @async
   * @function create
   * @param {CreateImageDto} createImageDto - An object containing the base64 string of the image and the type of image being uploaded.
   * @param {User} userRequest - The user object of the requester, used to assign ownership of the created image.
   * @returns {Promise<object>} A promise that resolves to the formatted data of the newly created image. If an error occurs,
   *                            the promise rejects with an error and the error is handled appropriately.
   * @throws Captures and handles exceptions related to image upload or database operations.
   */
  public create = async (
    createImageDto: CreateImageDto,
    userRequest: User,
    clientIp: string,
  ) => {
    try {
      const { base64, type } = createImageDto
      const cloudResponse = await this.cloudAdapter.uploadImage(base64, type)

      const image = await this.imageModel.create({
        createdBy: userRequest.id,
        createdAt: this.dayjsAdapter.getCurrentDateTime(),
        updatedAt: this.dayjsAdapter.getCurrentDateTime(),
        ...cloudResponse,
      });

      await this.trackModel.create({
        ip: clientIp,
        description: `Image ${ image.id } was created.`,
        module: 'Images',
        createdAt: this.dayjsAdapter.getCurrentDateTime(),
        user: userRequest.id
      })

      return this.formatReturnData(image)
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }

  /**
   * Finds multiple images with pagination and optional filtering. This method retrieves images
   * based on pagination and filter criteria. It structures the response to include pagination details and
   * the filtered list of images. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function findMany
   * @param {any} paginationDto - Data Transfer Object for pagination and filtering.
   * @returns {Promise<object>} A promise that resolves to an object containing pagination details and the filtered images.
   * @throws {Exception} Throws an exception if an error occurs during the retrieval process.
   */
  public findMany = async (paginationDto: any) => {
    const { limit, offset, filter } = paginationDto ? JSON.parse(paginationDto) : { limit: this.defaultLimit, offset: 0, filter: '' };
    const setOffset = offset === undefined ? 0 : offset
    const setLimit = limit === undefined ? this.defaultLimit : limit
    const isSearch = filter !== '' ? true : false
    try {
      const options: PaginateOptions = {
        offset: setOffset,
        limit: setLimit,
        populate: [ ],
        sort: { createdAt: 1 },
        customLabels: {
          meta: 'pagination'
        }
      };        
      let data: any = {
        deleted: false,
      }
      if(isSearch) {
        data = {
          $or: [
            { 
              imageUrl: new RegExp(filter, 'i'),
              deleted: false,
            },
            { 
              publicId: new RegExp(filter, 'i'),
              deleted: false,
            },
            {
              folder: new RegExp(filter, 'i'),
              deleted: false,
            },
            {
              format: new RegExp(filter, 'i'),
              deleted: false,
            },
          ]
        }
      }
      const imagesResponse = await this.imageModel.paginate(data, options)
      return {
        data: {
          pagination: imagesResponse?.pagination || {},
          images: imagesResponse?.docs.map((image) => this.formatReturnData(image)),
        }
      }
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }

  /**
   * Finds a single image by its ID. This method uses the findImage method to retrieve the image
   * and then formats the data using formatReturnData. Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function findOne
   * @param {string} id - The ID of the image to find.
   * @returns {Promise<object>} A promise that resolves to the formatted image data.
   * @throws {Exception} Throws an exception if an error occurs during the retrieval process.
   */
  public findOne = async (id: string): Promise<object> => {
    try {
      const image = await this.findImage(id)
      return this.formatReturnData(image)
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }

  /**
   * Deactivates an image by its ID. This method updates the image's status to inactive, logs the
   * deactivation event, and does not return any data. If the image is not found, it throws a NotFoundException.
   * Errors are handled by the handleExceptions method.
   *
   * @public
   * @async
   * @function remove
   * @param {string} id - The ID of the image to deactivate.
   * @param {User} userRequest - The user who requested the deactivation.
   * @param {string} clientIp - The IP address of the client making the request.
   * @returns {Promise<void>} A promise that resolves when the deactivation process is complete.
   * @throws {NotFoundException} Throws this exception if the image with the specified ID is not found.
   * @throws {Exception} Throws an exception if an error occurs during the deactivation process.
   */
  public remove = async (id: string, userRequest: User = null, clientIp: string = null) => {
    try {
      const image = await this.imageModel.findById(id)

      if(!image) {
        throw new NotFoundException(error.IMAGE_NOT_FOUND)
      }
      const { publicId } = image

      await image.deleteOne();
      await this.cloudAdapter.deleteResource(publicId)

      if(userRequest && clientIp) {
        await this.trackModel.create({
          ip: clientIp,
          description: `Image ${ image.id } was deleted.`,
          module: 'Images',
          createdAt: this.dayjsAdapter.getCurrentDateTime(),
          user: userRequest.id
        })
      }
      
      return
    } catch (error) {
      this.handleErrors.handleExceptions(error)
    }
  }
}
