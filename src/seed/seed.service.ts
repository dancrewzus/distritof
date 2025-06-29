import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { PaymentModality } from 'src/functionalities/modalities/entities/payment-modality.entity'
import { ContractPayment } from 'src/functionalities/contract-payments/entities/payment.entity'
import { ContractPending } from 'src/functionalities/contract-pending/entities/pending.entity'
import { CompanyLicense } from 'src/functionalities/companies/entities/company-license.entity'
import { Neighborhood } from 'src/functionalities/neighborhoods/entities/neighborhood.entity'
import { Notification } from 'src/functionalities/notifications/entities/notification.entity'
import { Identifier } from 'src/functionalities/identifiers/entities/identifier.entity'
import { ContractNote } from 'src/functionalities/contract-notes/entities/note.entity'
import { Parameter } from 'src/functionalities/parameters/entities/parameter.entity'
import { UserCompany } from 'src/functionalities/users/entities/userCompany.entity'
import { Geolocation } from 'src/functionalities/users/entities/geolocation.entity'
import { Contract } from 'src/functionalities/contracts/entities/contracts.entity'
import { Currency } from 'src/functionalities/currencies/entities/currency.entity'
import { Movement } from 'src/functionalities/movements/entities/movement.entity'
import { RouteUser } from 'src/functionalities/routes/entities/routeUser.entity'
import { Company } from 'src/functionalities/companies/entities/company.entity'
import { Country } from 'src/functionalities/countries/entities/country.entity'
import { Payment } from 'src/functionalities/payments/entities/payment.entity'
import { License } from 'src/functionalities/licenses/entities/license.entity'
import { Holiday } from 'src/functionalities/holidays/entities/holiday.entity'
import { UserData } from 'src/functionalities/users/entities/userData.entity'
import { Arrear } from 'src/functionalities/arrears/entities/arrear.entity'
import { Image } from 'src/functionalities/images/entities/image.entity'
import { Track } from 'src/functionalities/tracks/entities/track.entity'
import { Route } from 'src/functionalities/routes/entities/route.entity'
import { City } from 'src/functionalities/cities/entities/city.entity'
import { Role } from 'src/functionalities/roles/entities/role.entity'
import { User } from 'src/functionalities/users/entities/user.entity'

import { HandleErrors } from 'src/common/utils/handleErrors.util'
import { CloudAdapter } from 'src/common/adapters/cloud.adapter'
import { MailAdapter } from 'src/common/adapters/mail.adapter'
import { SeedData } from './data/data.seed';

@Injectable()
export class SeedService {

  private readonly logger = new Logger('SeedService');
  private readonly models: { [key: string]: { [key: string]: Model<any> } } = {};

  constructor(
    @InjectModel(Arrear.name, 'production') arrearProd: Model<Arrear>,
    @InjectModel(City.name, 'production') cityProd: Model<City>,
    @InjectModel(Company.name, 'production') companyProd: Model<Company>,
    @InjectModel(CompanyLicense.name, 'production') companyLicenseProd: Model<CompanyLicense>,
    @InjectModel(ContractNote.name, 'production') contractNoteProd: Model<ContractNote>,
    @InjectModel(ContractPayment.name, 'production') contractPaymentProd: Model<ContractPayment>,
    @InjectModel(ContractPending.name, 'production') contractPendingProd: Model<ContractPending>,
    @InjectModel(Contract.name, 'production') contractProd: Model<Contract>,
    @InjectModel(Country.name, 'production') countryProd: Model<Country>,
    @InjectModel(Currency.name, 'production') currencyProd: Model<Currency>,
    @InjectModel(Geolocation.name, 'production') geolocationProd: Model<Geolocation>,
    @InjectModel(Holiday.name, 'production') holidayProd: Model<Holiday>,
    @InjectModel(Identifier.name, 'production') identifierProd: Model<Identifier>,
    @InjectModel(Image.name, 'production') imageProd: Model<Image>,
    @InjectModel(License.name, 'production') licenseProd: Model<License>,
    @InjectModel(Movement.name, 'production') movementProd: Model<Movement>,
    @InjectModel(Neighborhood.name, 'production') neighborhoodProd: Model<Neighborhood>,
    @InjectModel(Notification.name, 'production') notificationProd: Model<Notification>,
    @InjectModel(Parameter.name, 'production') parameterProd: Model<Parameter>,
    @InjectModel(PaymentModality.name, 'production') paymentModalityProd: Model<PaymentModality>,
    @InjectModel(Payment.name, 'production') paymentProd: Model<Payment>,
    @InjectModel(Role.name, 'production') roleProd: Model<Role>,
    @InjectModel(Route.name, 'production') routeProd: Model<Route>,
    @InjectModel(RouteUser.name, 'production') routeUserProd: Model<RouteUser>,
    @InjectModel(Track.name, 'production') trackProd: Model<Track>,
    @InjectModel(UserCompany.name, 'production') userCompanyProd: Model<UserCompany>,
    @InjectModel(UserData.name, 'production') userDataProd: Model<UserData>,
    @InjectModel(User.name, 'production') userProd: Model<User>,

    @InjectModel(Arrear.name, 'test') arrearTest: Model<Arrear>,
    @InjectModel(City.name, 'test') cityTest: Model<City>,
    @InjectModel(Company.name, 'test') companyTest: Model<Company>,
    @InjectModel(CompanyLicense.name, 'test') companyLicenseTest: Model<CompanyLicense>,
    @InjectModel(ContractNote.name, 'test') contractNoteTest: Model<ContractNote>,
    @InjectModel(ContractPayment.name, 'test') contractPaymentTest: Model<ContractPayment>,
    @InjectModel(ContractPending.name, 'test') contractPendingTest: Model<ContractPending>,
    @InjectModel(Contract.name, 'test') contractTest: Model<Contract>,
    @InjectModel(Country.name, 'test') countryTest: Model<Country>,
    @InjectModel(Currency.name, 'test') currencyTest: Model<Currency>,
    @InjectModel(Geolocation.name, 'test') geolocationTest: Model<Geolocation>,
    @InjectModel(Holiday.name, 'test') holidayTest: Model<Holiday>,
    @InjectModel(Identifier.name, 'test') identifierTest: Model<Identifier>,
    @InjectModel(Image.name, 'test') imageTest: Model<Image>,
    @InjectModel(License.name, 'test') licenseTest: Model<License>,
    @InjectModel(Movement.name, 'test') movementTest: Model<Movement>,
    @InjectModel(Neighborhood.name, 'test') neighborhoodTest: Model<Neighborhood>,
    @InjectModel(Notification.name, 'test') notificationTest: Model<Notification>,
    @InjectModel(Parameter.name, 'test') parameterTest: Model<Parameter>,
    @InjectModel(PaymentModality.name, 'test') paymentModalityTest: Model<PaymentModality>,
    @InjectModel(Payment.name, 'test') paymentTest: Model<Payment>,
    @InjectModel(Role.name, 'test') roleTest: Model<Role>,
    @InjectModel(Route.name, 'test') routeTest: Model<Route>,
    @InjectModel(RouteUser.name, 'test') routeUserTest: Model<RouteUser>,
    @InjectModel(Track.name, 'test') trackTest: Model<Track>,
    @InjectModel(UserCompany.name, 'test') userCompanyTest: Model<UserCompany>,
    @InjectModel(UserData.name, 'test') userDataTest: Model<UserData>,
    @InjectModel(User.name, 'test') userTest: Model<User>,
    
    @InjectModel(Arrear.name, 'development') arrearDev: Model<Arrear>,
    @InjectModel(City.name, 'development') cityDev: Model<City>,
    @InjectModel(Company.name, 'development') companyDev: Model<Company>,
    @InjectModel(CompanyLicense.name, 'development') companyLicenseDev: Model<CompanyLicense>,
    @InjectModel(ContractNote.name, 'development') contractNoteDev: Model<ContractNote>,
    @InjectModel(ContractPayment.name, 'development') contractPaymentDev: Model<ContractPayment>,
    @InjectModel(ContractPending.name, 'development') contractPendingDev: Model<ContractPending>,
    @InjectModel(Contract.name, 'development') contractDev: Model<Contract>,
    @InjectModel(Country.name, 'development') countryDev: Model<Country>,
    @InjectModel(Currency.name, 'development') currencyDev: Model<Currency>,
    @InjectModel(Geolocation.name, 'development') geolocationDev: Model<Geolocation>,
    @InjectModel(Holiday.name, 'development') holidayDev: Model<Holiday>,
    @InjectModel(Identifier.name, 'development') identifierDev: Model<Identifier>,
    @InjectModel(Image.name, 'development') imageDev: Model<Image>,
    @InjectModel(License.name, 'development') licenseDev: Model<License>,
    @InjectModel(Movement.name, 'development') movementDev: Model<Movement>,
    @InjectModel(Neighborhood.name, 'development') neighborhoodDev: Model<Neighborhood>,
    @InjectModel(Notification.name, 'development') notificationDev: Model<Notification>,
    @InjectModel(Parameter.name, 'development') parameterDev: Model<Parameter>,
    @InjectModel(PaymentModality.name, 'development') paymentModalityDev: Model<PaymentModality>,
    @InjectModel(Payment.name, 'development') paymentDev: Model<Payment>,
    @InjectModel(Role.name, 'development') roleDev: Model<Role>,
    @InjectModel(Route.name, 'development') routeDev: Model<Route>,
    @InjectModel(RouteUser.name, 'development') routeUserDev: Model<RouteUser>,
    @InjectModel(Track.name, 'development') trackDev: Model<Track>,
    @InjectModel(UserCompany.name, 'development') userCompanyDev: Model<UserCompany>,
    @InjectModel(UserData.name, 'development') userDataDev: Model<UserData>,
    @InjectModel(User.name, 'development') userDev: Model<User>,
    
    @InjectModel(Arrear.name, 'backup') arrearBackup: Model<Arrear>,
    @InjectModel(City.name, 'backup') cityBackup: Model<City>,
    @InjectModel(Company.name, 'backup') companyBackup: Model<Company>,
    @InjectModel(CompanyLicense.name, 'backup') companyLicenseBackup: Model<CompanyLicense>,
    @InjectModel(ContractNote.name, 'backup') contractNoteBackup: Model<ContractNote>,
    @InjectModel(ContractPayment.name, 'backup') contractPaymentBackup: Model<ContractPayment>,
    @InjectModel(ContractPending.name, 'backup') contractPendingBackup: Model<ContractPending>,
    @InjectModel(Contract.name, 'backup') contractBackup: Model<Contract>,
    @InjectModel(Country.name, 'backup') countryBackup: Model<Country>,
    @InjectModel(Currency.name, 'backup') currencyBackup: Model<Currency>,
    @InjectModel(Geolocation.name, 'backup') geolocationBackup: Model<Geolocation>,
    @InjectModel(Holiday.name, 'backup') holidayBackup: Model<Holiday>,
    @InjectModel(Identifier.name, 'backup') identifierBackup: Model<Identifier>,
    @InjectModel(Image.name, 'backup') imageBackup: Model<Image>,
    @InjectModel(License.name, 'backup') licenseBackup: Model<License>,
    @InjectModel(Movement.name, 'backup') movementBackup: Model<Movement>,
    @InjectModel(Neighborhood.name, 'backup') neighborhoodBackup: Model<Neighborhood>,
    @InjectModel(Notification.name, 'backup') notificationBackup: Model<Notification>,
    @InjectModel(Parameter.name, 'backup') parameterBackup: Model<Parameter>,
    @InjectModel(PaymentModality.name, 'backup') paymentModalityBackup: Model<PaymentModality>,
    @InjectModel(Payment.name, 'backup') paymentBackup: Model<Payment>,
    @InjectModel(Role.name, 'backup') roleBackup: Model<Role>,
    @InjectModel(Route.name, 'backup') routeBackup: Model<Route>,
    @InjectModel(RouteUser.name, 'backup') routeUserBackup: Model<RouteUser>,
    @InjectModel(Track.name, 'backup') trackBackup: Model<Track>,
    @InjectModel(UserCompany.name, 'backup') userCompanyBackup: Model<UserCompany>,
    @InjectModel(UserData.name, 'backup') userDataBackup: Model<UserData>,
    @InjectModel(User.name, 'backup') userBackup: Model<User>,

    private readonly handleErrors: HandleErrors,
    private readonly cloudAdapter: CloudAdapter,
    private readonly mailAdapter: MailAdapter,
    private readonly seedData: SeedData
  ) {
    this.models['production'] = {
      arrear: arrearProd,
      city: cityProd,
      company: companyProd,
      companyLicense: companyLicenseProd,
      contractNote: contractNoteProd,
      contractPayment: contractPaymentProd,
      contractPending: contractPendingProd,
      contract: contractProd,
      country: countryProd,
      currency: currencyProd,
      geolocation: geolocationProd,
      holiday: holidayProd,
      identifier: identifierProd,
      image: imageProd,
      license: licenseProd,
      movement: movementProd,
      neighborhood: neighborhoodProd,
      notification: notificationProd,
      parameter: parameterProd,
      paymentModality: paymentModalityProd,
      payment: paymentProd,
      role: roleProd,
      route: routeProd,
      routeUser: routeUserProd,
      track: trackProd,
      userCompany: userCompanyProd,
      userData: userDataProd,
      user: userProd
    };
    this.models['test'] = {
      arrear: arrearTest,
      city: cityTest,
      company: companyTest,
      companyLicense: companyLicenseTest,
      contractNote: contractNoteTest,
      contractPayment: contractPaymentTest,
      contractPending: contractPendingTest,
      contract: contractTest,
      country: countryTest,
      currency: currencyTest,
      geolocation: geolocationTest,
      holiday: holidayTest,
      identifier: identifierTest,
      image: imageTest,
      license: licenseTest,
      movement: movementTest,
      neighborhood: neighborhoodTest,
      notification: notificationTest,
      parameter: parameterTest,
      paymentModality: paymentModalityTest,
      payment: paymentTest,
      role: roleTest,
      route: routeTest,
      routeUser: routeUserTest,
      track: trackTest,
      userCompany: userCompanyTest,
      userData: userDataTest,
      user: userTest
    };
    this.models['development'] = {
      arrear: arrearDev,
      city: cityDev,
      company: companyDev,
      companyLicense: companyLicenseDev,
      contractNote: contractNoteDev,
      contractPayment: contractPaymentDev,
      contractPending: contractPendingDev,
      contract: contractDev,
      country: countryDev,
      currency: currencyDev,
      geolocation: geolocationDev,
      holiday: holidayDev,
      identifier: identifierDev,
      image: imageDev,
      license: licenseDev,
      movement: movementDev,
      neighborhood: neighborhoodDev,
      notification: notificationDev,
      parameter: parameterDev,
      paymentModality: paymentModalityDev,
      payment: paymentDev,
      role: roleDev,
      route: routeDev,
      routeUser: routeUserDev,
      track: trackDev,
      userCompany: userCompanyDev,
      userData: userDataDev,
      user: userDev
    };
    this.models['backup'] = {
      arrear: arrearBackup,
      city: cityBackup,
      company: companyBackup,
      companyLicense: companyLicenseBackup,
      contractNote: contractNoteBackup,
      contractPayment: contractPaymentBackup,
      contractPending: contractPendingBackup,
      contract: contractBackup,
      country: countryBackup,
      currency: currencyBackup,
      geolocation: geolocationBackup,
      holiday: holidayBackup,
      identifier: identifierBackup,
      image: imageBackup,
      license: licenseBackup,
      movement: movementBackup,
      neighborhood: neighborhoodBackup,
      notification: notificationBackup,
      parameter: parameterBackup,
      paymentModality: paymentModalityBackup,
      payment: paymentBackup,
      role: roleBackup,
      route: routeBackup,
      routeUser: routeUserBackup,
      track: trackBackup,
      userCompany: userCompanyBackup,
      userData: userDataBackup,
      user: userBackup
    };
  }

  /**
   * SEED
   */

  private async deleteAllData(env: string): Promise<void> {
    const models = Object.values(this.models[env]);
    await Promise.all(models.map(model => model.deleteMany()));
    this.logger.log(`✅ - All data deleted for ${env}`);
  }

  private async seedIdentifiers(env: string): Promise<void> {
    const identifiers = this.seedData.getIdentifiers();
    await this.models[env].identifier.insertMany(identifiers);
    this.logger.log(`✅ - Identifiers seeded for ${env}`);
  }

  private async seedCountries(env: string): Promise<void> {

    const currencies = await this.models[env].currency.find();
  
    if (!currencies || currencies.length === 0) {
      throw new Error(`No currencies found for environment: ${env}`);
    }

    const countriesToInsert = this.seedData.getCountries().map(country => {
      const currency = currencies.find(c => c.code === country.currencyCode);
  
      if (!currency) {
        throw new Error(`Currency not found for country with currencyCode: ${country.currencyCode}`);
      }
  
      return { ...country, currency: currency._id };
    });

    await this.models[env].country.insertMany(countriesToInsert);
    this.logger.log(`✅ - Countries seeded for ${env}`);
  }

  private async seedRoles(env: string): Promise<void> {
    const roles = this.seedData.getRoles();
    await this.models[env].role.insertMany(roles);
    this.logger.log(`✅ - Roles seeded for ${env}`);
  }

  private async seedUsers(env: string): Promise<void> {
    const identifiers = await this.models[env].identifier.find();
    const countries = await this.models[env].country.find();
    const roles = await this.models[env].role.find();
  
    if (!identifiers || !countries || !roles) {
      throw new Error(`Required data (identifiers, countries, roles) not found for environment: ${env}`);
    }
  
    const systemIdentifier = identifiers.find((el) => el.name === 'System');
    const primaryRole = roles.find((role) => role.primary);
  
    if (!systemIdentifier || !primaryRole) {
      throw new Error(`System Identifier or Primary Role not found for environment: ${env}`);
    }
  
    const usersBeforeInsert = this.seedData.getUsers();
  
    for (let index = 0; index < usersBeforeInsert.length; index++) {
      const user = usersBeforeInsert[index];
  
      const {
        email,
        password,
        role: roleName,
        country: countryCode,
        firstName,
        paternalSurname,
        validationCode,
        createdAt,
        updatedAt,
        ...userDataFields
      } = user;
  
      // Find related data
      const role = roles.find((r) => r.name === roleName);
      const country = countries.find((c) => c.code === countryCode);
  
      if (!role || !country) {
        throw new Error(`Role or Country not found for user: ${email}`);
      }
  
      const isSuperUser = roleName === 'root';
  
      // Create User
      const createdUser = await this.models[env].user.create({
        firstName,
        paternalSurname,
        identifier: `sys-${index}`,
        identifierType: systemIdentifier._id,
        country: country._id,
        email,
        password: bcrypt.hashSync(password, 10),
        isSuperUser,
        isLogged: true,
        validationCode,
        role: role._id || primaryRole._id,
        createdBy: null,
        createdAt,
        updatedAt,
      });
  
      // Add User to Role
      if (!role.users) {
        role.users = [];
      }
      role.users.push(createdUser._id);
      await role.save();
  
      // Create UserData
      const createdUserData = await this.models[env].userData.create({
        ...userDataFields,
        user: createdUser._id,
        createdAt,
        updatedAt,
      });
  
      // Link UserData to User
      createdUser.userData = createdUserData._id;
      await createdUser.save();
    }
  
    this.logger.log(`✅ - Users and UserData seeded for ${env}`);
  }

  private async seedCurrencies(env: string): Promise<void> {
    const currenciesToInsert = this.seedData.getCurrencies();
  
    if (!currenciesToInsert || currenciesToInsert.length === 0) {
      throw new Error('No currencies found in seed data.');
    }
  
    await this.models[env].currency.insertMany(currenciesToInsert);
    this.logger.log(`✅ - Currencies seeded for ${env}`);
  }

  private async seedLicenses(env: string): Promise<void> {
    const currencies = await this.models[env].currency.find();
  
    if (!currencies || currencies.length === 0) {
      throw new Error(`No currencies found for environment: ${env}`);
    }
  
    const licensesToInsert = this.seedData.getLicenses().map(license => {
      const currency = currencies.find(c => c.code === license.currencyCode);
  
      if (!currency) {
        throw new Error(`Currency not found for license with currencyCode: ${license.currencyCode}`);
      }
  
      return { ...license, currency: currency._id };
    });
  
    const createdLicenses = await this.models[env].license.insertMany(licensesToInsert);
  
    // Vincular las licencias con sus monedas
    for (const license of createdLicenses) {
      const currency = currencies.find(curr => String(curr._id) === String(license.currency));
      if (currency) {
        currency.licenses.push(license._id as unknown as License); // Agregar referencia
        await currency.save();
      }
    }
  
    this.logger.log(`✅ - Licenses seeded and linked to currencies for ${env}`);
  }

  private async deleteImages(env: string): Promise<void> {
    const images = await this.models[env].image.find({}, 'publicId').lean().exec();
    const publicIds = images.map(img => img.publicId);

    await this.cloudAdapter.deleteAllResources(publicIds);
    await this.models[env].image.deleteMany();
    this.logger.log(`✅ - Images deleted for ${env}`);
  }

  /**
   * PUBLIC
   */

  public async seedAll(): Promise<string> {
    try {
      const envs = ['production', 'test', 'development', 'backup'];

      for (const env of envs) {
        await this.deleteAllData(env);
        await Promise.all([
          this.seedIdentifiers(env),
          this.seedRoles(env),
          this.seedCurrencies(env),
        ]);
        await this.seedCountries(env),
        await this.seedUsers(env);
        await this.seedLicenses(env);
        await this.deleteImages(env);
      }

      this.logger.log('✅✅ - All data seeded successfully');
      return `✅✅✅ - Everything seeded successfully.`;
    } catch (error) {
      this.logger.error('Seeding failed', error);
      this.handleErrors.handleExceptions(error);
      throw error;
    }
  }

  /**
   * Backs up all data from the 'production' database to the 'backup' database.
   * Deletes previous data in the 'backup' database before inserting new data.
   * 
   * @async
   * @function backupData
   * @public
   * @returns {Promise<void>}
   * @throws {Error} Throws an error if the backup process fails.
   */
  public async backupData(environment: string = null): Promise<string> {
    try {
      const environments = ['production', (environment || 'backup')];
      const [sourceEnv, targetEnv] = environments;

      this.logger.log(`Starting backup process from ${sourceEnv} to ${targetEnv}...`);

      await this.deleteAllData(targetEnv)

      const models = Object.keys(this.models[sourceEnv]);

      for (const modelName of models) {
        const sourceModel = this.models[sourceEnv][modelName];
        const targetModel = this.models[targetEnv][modelName];

        // Ensure both models exist
        if (!sourceModel || !targetModel) {
          this.logger.warn(`Skipping backup for ${modelName}: Model not found.`);
          continue;
        }

        // Fetch data from source
        const data = await sourceModel.find().lean();

        if (data.length > 0) {
          await targetModel.insertMany(data);
          this.logger.log(`Backup completed for collection: ${modelName}`);
        } else {
          this.logger.log(`No data found for collection: ${modelName}`);
        }
      }

      this.logger.log('✅✅ - Backup process completed successfully.');
      return `✅✅✅ - Backup completed successfully.`;
    } catch (error) {
      this.logger.error('Backup process failed', error);
      this.handleErrors.handleExceptions(error);
      throw error;
    }
  }

  public async backupAndSendEmail(): Promise<void> {
    await Promise.all([

    ])

    return
  }
}


// //   /**
// //    * Clones data from production database models (images, roles, users) into the corresponding development
// //    * or staging database models. This function first fetches all data from the production models, then clears
// //    * the existing data in the development models before inserting the fetched production data. This is useful
// //    * for scenarios where a copy of the production data is needed in a non-production environment for testing
// //    * or development purposes. The function ensures all operations are performed atomically to avoid partial data states.
// //    *
// //    * @async
// //    * @function cloneDatabase
// //    * @public
// //    * @param {{}} _ - Currently, no parameters are required for this function.
// //    * @returns {Promise<string>} A promise that resolves to a string indicating that the backup process has
// //    *                            been completed successfully.
// //    * @throws {Error} Handles any errors that arise during the cloning process by delegating to a centralized
// //    *                 error handling method, which processes and logs the exceptions accordingly.
// //    */ 
// //   public cloneDatabase = async ({ }) => {
// //     // TODO mejorar la función, agregar funcionalidad de exportar y enviar por correo para respaldo
// //     // FALTA holiday, modality, notification
// //     try {
// //       const [
// //         identifiers,
// //         roles,
// //         users,
// //         usersData,
// //         countries,
// //         currencies,
// //         licenses,
// //         companies,
// //         companyLicenses,
// //         tracks,
// //         images,
// //       ] = await Promise.all([
// //         this.identifierModelProduction.find(),
// //         this.roleModelProduction.find().populate([ 'users' ]),
// //         this.userModelProduction.find().populate([ 'identifierType', 'country', 'role', 'companies', 'tracks', 'createdBy', 'userData' ]),
// //         this.userDataModelProduction.find().populate([ 'profilePicture', 'addressPicture', 'user' ]),
// //         this.countryModelProduction.find().populate([ 'companies' ]),
// //         this.currencyModelProduction.find().populate([ 'licenses' ]),
// //         this.licenseModelProduction.find().populate([ 'currency' ]),
// //         this.companyModelProduction.find().populate([ 'representative', 'country', 'licenses', 'users' ]),
// //         this.companyLicenseModelProduction.find().populate([ 'company', 'license', 'createdBy' ]),
// //         this.trackModelProduction.find().populate([ 'user' ]),
// //         this.imageModelProduction.find().populate([ 'createdBy' ]),
// //       ])

// //       await this.identifierModel.insertMany(identifiers)
// //       await this.roleModel.insertMany(roles)
// //       await this.userModel.insertMany(users)
// //       await this.userDataModel.insertMany(usersData)
// //       await this.countryModel.insertMany(countries)
// //       await this.currencyModel.insertMany(currencies)
// //       await this.licenseModel.insertMany(licenses)
// //       await this.companyModel.insertMany(companies)
// //       await this.companyLicenseModel.insertMany(companyLicenses)
// //       await this.trackModel.insertMany(tracks)
// //       await this.imageModel.insertMany(images)

// //       this.logger.log('✅ - Backup completed successfully.')

// //     } catch (error) {
// //       this.handleErrors.handleExceptions(error)
// //     }
// //   }

  // private extractWodContent(html: string): string {
  //   const $ = cheerio.load(html); // Cargar el HTML en Cheerio
  //   const wodDiv = $('.today-wod'); // Seleccionar el div con la clase "today-wod"

  //   // Retorna el contenido HTML dentro del div
  //   return wodDiv.html(); // Si prefieres solo texto, usa `.text()` en su lugar
  // }

  // private convertHtmlToJson(html: string) {
  //   // Cargar el HTML en Cheerio
  //   const $ = cheerio.load(html);
  
  //   // Definir el objeto JSON que vamos a construir
  //   const wodJson: any = {
  //     date: '',
  //     components: []
  //   };
  
  //   // Extraer la fecha
  //   wodJson.date = $('.box-title a').text().trim();
  
  //   // Inicializar variables para el análisis del contenido del WOD
  //   let currentSection: any = null;
  
  //   // Iterar sobre los elementos dentro del contenido del WOD
  //   $('.today-wod-components .trix-content').children().each((_, element) => {
  //     const tagName = $(element).prop('tagName').toLowerCase();
  //     const text = $(element).text().trim();
  
  //     // Si encontramos un <strong>, indica el título de una nueva sección
  //     if (tagName === 'blockquote' && $(element).find('strong').length > 0) {
  //       const sectionTitle = $(element).find('strong').text().trim();
        
  //       // Crear una nueva sección en el JSON
  //       currentSection = {
  //         title: sectionTitle,
  //         content: []
  //       };
  
  //       wodJson.components.push(currentSection);
  //     } else if (currentSection && text) {
  //       // Añadir el contenido a la sección actual
  //       currentSection.content.push(text);
  //     }
  //   });
  
  //   return wodJson;
  // }

//   public getTrainings = async () => {

//     const date = `Lun%2008%2F01%2F2024`

//     const url = `https://crosshero.com/dashboard/classes?date=${ date }&program_id=5d94fa626a7c740041967675`

//     const headers = {
//       'Cookie': 'ahoy_visitor=dc7de1c0-8583-452a-a2cc-93004de6077b; ahoy_visit=3b95aee9-3f82-4df5-8bb5-6e83a3231b9c; _gcl_aw=GCL.1728906987.Cj0KCQjwgrO4BhC2ARIsAKQ7zUnK8zBpQGZw8EONmuLk8l9Qu2a-E2Us0dZ60z1U2D6g9LsYCzUNAIIaAi1EEALw_wcB; _gcl_gs=2.1.k1$i1728906985$u156421609; _gcl_au=1.1.1538778558.1728906987; _fbp=fb.1.1728906987241.264723285181937561; _hjSessionUser_3044567=eyJpZCI6IjQ5ZTQ1OGJlLTI1YTctNTRkYy04MzMwLWRmOWQ1ZDhkMDU4NSIsImNyZWF0ZWQiOjE3Mjg5MDY5ODc1NDgsImV4aXN0aW5nIjpmYWxzZX0=; _hjSession_3044567=eyJpZCI6IjRlM2YzMGIzLThiMDgtNGJjOC1hMDFmLWMwNjZlZTA4NjQ1NiIsImMiOjE3Mjg5MDY5ODc1NDksInMiOjAsInIiOjAsInNiIjowLCJzciI6MCwic2UiOjAsImZzIjoxLCJzcCI6MH0=; rewardful.referral={%22id%22:%22fb788b6e-4a9a-4be6-b57c-2a9de51b05bb%22%2C%22created_at%22:%222024-10-14T11:56:28.148Z%22%2C%22affiliate%22:{%22id%22:%22aaa81355-bce6-4267-834e-4e8a3b1e9868%22%2C%22name%22:%22Andreu%20Perez%22%2C%22first_name%22:%22Andreu%22%2C%22last_name%22:%22Perez%22%2C%22token%22:%22website%22}%2C%22campaign%22:{%22id%22:%22bbbffbeb-e74c-401a-93fe-4819d7176b23%22%2C%22name%22:%22Friends%20of%20CrossHero%22}%2C%22coupon%22:null%2C%22cookie%22:{%22domain%22:%22crosshero.com%22}}; intercom-id-yysau9py=54b97241-5de6-4e56-8109-526f8200644c; intercom-session-yysau9py=; intercom-device-id-yysau9py=f24f9251-e781-46b3-a51e-95c3e3819923; _ga_DC7EKF7G3Z=GS1.1.1728906987.1.0.1728906989.0.0.0; remember_athlete_token=eyJfcmFpbHMiOnsibWVzc2FnZSI6Ilcxc2lOalptWmpJNE9UUXlNVEl3WldFd01ETTFNbVV6TnpVM0lsMHNJaVF5WVNReE1pUlNWRXBrZUhCNmFtd3ZkVVpKU1VJM1VqUm5kbFl1SWl3aU1UY3lPRGt3TnpZNE5pNHpNVFF3TlRVeUlsMD0iLCJleHAiOiIyMDI0LTEwLTI4VDEyOjA4OjA2LjMxNFoiLCJwdXIiOiJjb29raWUucmVtZW1iZXJfYXRobGV0ZV90b2tlbiJ9fQ%3D%3D--d083fe4f6d7a2b82a9540a2b3da3b4cd8da3ed38; _crosshero_session=3966982da6bce1361c3f5cebf52ac600; all_cookies_accepted=true; _ga=GA1.2.1678442243.1728906987; _gid=GA1.2.73317806.1728907707; _gat=1; _ga_KJEQQ9Y9FG=GS1.2.1728907707.1.1.1728907731.36.0.0; _crosshero_session=3966982da6bce1361c3f5cebf52ac600; ahoy_visit=3b95aee9-3f82-4df5-8bb5-6e83a3231b9c; ahoy_visitor=669c6738-93fe-4a81-b357-50a3efaef999'
//     };

//     try {
//       const response = await lastValueFrom(
//         this.httpService.get(url, { headers })
//       );
//       const html = response.data;
//       const wodContentHtml = this.extractWodContent(html);
//       const wodContentJSON = this.convertHtmlToJson(wodContentHtml);
//       return wodContentJSON;

//     } catch (error) {
//       throw new HttpException('Error fetching classes data', HttpStatus.INTERNAL_SERVER_ERROR);
//     }
//   }
// }
