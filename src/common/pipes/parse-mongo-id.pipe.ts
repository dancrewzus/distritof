import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { isObjectIdOrHexString } from 'mongoose';

@Injectable()
export class ParseMongoIdPipe implements PipeTransform {

  transform(value: string) {
    if(!isObjectIdOrHexString(value)) {
      throw new BadRequestException(`${ value } isn't a valid MongoID.`)
    }
    return value;
  }
}
