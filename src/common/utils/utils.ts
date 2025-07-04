import { Injectable } from "@nestjs/common";
import { User } from "src/functionalities/users/entities/user.entity";

@Injectable()
export class Utils {

  /**
   * Converts a given string to a "slug" format suitable for URLs. The conversion involves
   * lowercasing the entire string, replacing spaces with hyphens, and removing all non-alphanumeric
   * characters except hyphens. This function is useful for creating clean and SEO-friendly URLs
   * from titles or names.
   *
   * @public
   * @function convertToSlug
   * @param {string} string - The string to be converted into a slug.
   * @returns {string} The slugified version of the input string, which is lowercased, with spaces
   *                   replaced by hyphens, and stripped of all non-word characters.
   */
  public convertToSlug = (string: string): string => string.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')

  /**
   * Validates whether a given string conforms to a pattern suitable for URL slugs. The pattern ensures that the slug
   * consists only of lowercase letters, numbers, and hyphens. This is useful for ensuring that generated or inputted
   * slugs are compatible with URL standards and do not contain any invalid characters.
   *
   * @public
   * @function isValidSlug
   * @param {string} slug - The string to be validated as a slug.
   * @returns {boolean} Returns true if the string is a valid slug according to the pattern, otherwise returns false.
   */
  public isValidSlug = (slug: string) => {
    const slugPattern = /^[a-z0-9-]+$/;
    return slugPattern.test(slug);
  }

  /**
   * Creates a timer that completes after a specified number of milliseconds. This function is useful
   * for delaying operations within async functions, akin to using `setTimeout` in asynchronous
   * workflows. The returned Promise resolves after the specified delay, allowing the use of `await`
   * for pausing execution in an async function.
   *
   * @public
   * @function timer
   * @param {number} ms - The number of milliseconds to delay.
   * @returns {Promise<void>} A promise that resolves after the delay, effectively pausing execution
   *                          for the specified period.
   */
  public timer = (ms: number): Promise<unknown> => new Promise(res => setTimeout(res, ms))

  /**
   * Retrieves a shorthand permission code based on the user's role name. This utility function is used internally
   * to simplify and standardize the representation of user permissions across the application. Each role is mapped
   * to a specific shorthand that is returned when the role name matches a case in the switch statement.
   *
   * @private
   * @function getUserPermissions
   * @param {string} roleName - The name of the user role.
   * @returns {string} The shorthand code for the given user role. Returns an empty string if no matching role is found.
   */
  public getUserPermissions = (roleName: string): string => {
    switch (roleName) {
      case 'root': return this.code('root');
      case 'admin': return this.code('admin');
      case 'companyOwner': return this.code('companyOwner');
      case 'companyAdmin': return this.code('companyAdmin');
      case 'companySupervisor': return this.code('companySupervisor');
      case 'companyWorker': return this.code('companyWorker');
      case 'companyClient': return this.code('companyClient');
      default: return this.code('');
    }
  }

  /**
   * Capitalizes the first letter of a given string and returns the string with the initial letter capitalized
   * while keeping the rest of the string as is. This function is useful for ensuring that user input such as
   * names and titles are standardized in terms of capitalization, which can be important for UI display or data
   * consistency.
   *
   * @public
   * @function capitalizeFirstLetter
   * @param {string} str - The string to capitalize.
   * @returns {string} The modified string with the first letter capitalized.
   */
  public capitalizeFirstLetter = (str: string): string => {
    str = str.toLowerCase()
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Validates an email address against a regular expression to ensure it conforms to a standard email format.
   * The function uses a comprehensive regex pattern that covers a wide range of valid email characters, including
   * normal alphanumeric characters, special characters within the username part, and a valid domain format.
   *
   * @param {string} email - The email address to validate.
   * @returns {boolean} Returns true if the email matches the regex pattern, indicating it is a valid email address.
   *                    Returns false otherwise.
   */
  public validateEmail = (email: string): boolean => {
    const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return regex.test(email);
  }

  /**
   * Generates a random 8-character code consisting of uppercase letters, lowercase letters, and digits.
   * This function is useful for creating unique identifiers, temporary passwords, or verification codes.
   *
   * @public
   * @function generateRandomCode
   * @returns {string} A random 8-character string.
   */
  public generateRandomCode = (length: number = 8) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        code += characters[randomIndex];
    }
    return code;
  }

  public parseDay = (day: number): string => {
    switch (day) {
      case 0: return 'Sun';
      case 1: return 'Mon';
      case 2: return 'Tue';
      case 3: return 'Wed';
      case 4: return 'Thu';
      case 5: return 'Fri';
      case 6: return 'Sat';
      default: return '';
    }
  }

  public code(text: string): string {
    return btoa(text);
  }
  
  public decode(codedText: string): string {
    return atob(codedText);
  }

  public isEmptyObject = (obj) => {
    return Object.keys(obj).length === 0;
  }

  public getFullnameFromUser = (user: User): string => {
    return user ? `${ this.capitalizeFirstLetter(user.firstName) } ${ this.capitalizeFirstLetter(user.paternalSurname) }` : ''
  }

  public roundDecimals = (value: number, decimals: number = 2): number => {
    return parseFloat(value.toFixed(decimals));
  };

  public formatNumber = (amount: number) => {
    return Intl.NumberFormat('es-CL').format(amount)
  }
}

export { HandleErrors } from './handleErrors.util';