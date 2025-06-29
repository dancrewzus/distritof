import { Injectable } from "@nestjs/common";

import { HandleErrors } from "../utils/utils";

import * as customParseFormat from 'dayjs/plugin/customParseFormat'
import * as timezone from 'dayjs/plugin/timezone'
import * as utc from 'dayjs/plugin/utc'

import * as dayjs from 'dayjs'

dayjs.extend(customParseFormat)
dayjs.extend(timezone)
dayjs.extend(utc)

dayjs.tz.setDefault('America/Manaus')

// Constants for date and date-time formats
const DATE_TIME_FORMAT = 'DD/MM/YYYY HH:mm:ss';
const DATE_FORMAT = 'DD/MM/YYYY';
const DATE_FORMAT_B = 'YYYY-MM-DD';

@Injectable()
export class DayJSAdapter {

  constructor(
    private readonly errors: HandleErrors,
  ) { }
  
  /**
   * Retrieves the current date in 'DD/MM/YYYY' format.
   * @returns The current date as a string.
   */
  public getCurrentDate = (): string => {
    try {
      return dayjs().tz().format(DATE_FORMAT)
    } catch (error) {
      this.errors.handleError(`Error retrieving the current date: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  /**
   * Retrieves the current date and time in 'DD/MM/YYYY HH:mm:ss' format.
   * @returns The current date and time as a string.
   */
  public getCurrentDateTime = (): string => {
    try {
      return dayjs().tz().format(DATE_TIME_FORMAT)
    } catch (error) {
      this.errors.handleError(`Error retrieving the current date and time: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  public getUnixTimestamp = (): number => {
    try {
      return dayjs().tz().unix()
    } catch (error) {
      this.errors.handleError(`Error retrieving the current date and time: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  public sumDaysToDate = (date: string, days: number) => {
    try {
      return dayjs(date, DATE_FORMAT).add(days, 'd').format(DATE_FORMAT)
    } catch (error) {
      this.errors.handleError(`Error retrieving the current date and time: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  public sumMinutesToDate = (date: string, minutes: number) => {
    try {
      return dayjs(date, DATE_TIME_FORMAT).add(minutes, 'm').format(DATE_TIME_FORMAT)
    } catch (error) {
      this.errors.handleError(`Error retrieving the current date and time: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  public currentDateTimeIsBeforeOfDateTime = (dateTime: string) => {
    try {
      const currentDate = dayjs().tz()
      const dateTimeInstance = dayjs(`${ dateTime }`, DATE_TIME_FORMAT)

      return currentDate.isBefore(dateTimeInstance)
    } catch (error) {
      this.errors.handleError(`Error retrieving the current date and time: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  public getDayFromDate = (date: string) => {
    try {
      return dayjs(date, DATE_FORMAT).day()
    } catch (error) {
      this.errors.handleError(`Error retrieving the current date and time: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  public changeDateFormatFromDate = (date: string) => {
    try {
      return dayjs(date, DATE_FORMAT).format(DATE_FORMAT_B)
    } catch (error) {
      this.errors.handleError(`Error retrieving the current date and time: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  public getFormattedDateFromDateTime = (date: string) => {
    try {
      return dayjs(date, DATE_TIME_FORMAT).tz().format(DATE_FORMAT)
    } catch (error) {
      this.errors.handleError(`Error retrieving the current date and time: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  public getDateFromDateTime = (date: string) => {
    try {
      return dayjs(date, DATE_TIME_FORMAT).tz()
    } catch (error) {
      this.errors.handleError(`Error retrieving the current date and time: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  public dateIsSame = (dateA: string, dateB: string, dateTimeFormat: boolean = false) => {
    try {
      const firstDate = dayjs(dateA, dateTimeFormat ? DATE_TIME_FORMAT : DATE_FORMAT)
      const secondDate = dayjs(dateB, dateTimeFormat ? DATE_TIME_FORMAT : DATE_FORMAT)

      return firstDate.isSame(secondDate)
    } catch (error) {
      this.errors.handleError(`Error retrieving the current date and time: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  public dateIsBefore = (dateA: string, dateB: string, dateTimeFormat: boolean = true) => {
    try {
      const firstDate = dayjs(dateA, dateTimeFormat ? DATE_TIME_FORMAT : DATE_FORMAT)
      const secondDate = dayjs(dateB, dateTimeFormat ? DATE_TIME_FORMAT : DATE_FORMAT)

      return firstDate.isBefore(secondDate)
    } catch (error) {
      this.errors.handleError(`Error retrieving the current date and time: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  public dateIsAfter = (dateA: string, dateB: string, dateTimeFormat: boolean = true) => {
    try {
      const firstDate = dayjs(dateA, dateTimeFormat ? DATE_TIME_FORMAT : DATE_FORMAT)
      const secondDate = dayjs(dateB, dateTimeFormat ? DATE_TIME_FORMAT : DATE_FORMAT)

      return firstDate.isAfter(secondDate)
    } catch (error) {
      this.errors.handleError(`Error retrieving the current date and time: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  public dateDifference = (dateA: string, dateB: string, unit: any = 'days', dateTimeFormat: boolean = true) => {
    try {
      const firstDate = dayjs(dateA, dateTimeFormat ? DATE_TIME_FORMAT : DATE_FORMAT)
      const secondDate = dayjs(dateB, dateTimeFormat ? DATE_TIME_FORMAT : DATE_FORMAT)

      return firstDate.diff(secondDate, unit)
    } catch (error) {
      this.errors.handleError(`Error retrieving the current date and time: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}