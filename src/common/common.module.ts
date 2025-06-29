import { Module } from '@nestjs/common';

// import { OpenAiAdapter } from './adapters/openai.adapter';
import { AxiosAdapter } from './adapters/axios.adapter';
import { CloudAdapter } from './adapters/cloud.adapter';
import { DayJSAdapter } from './adapters/dayjs.adapter';
import { MailAdapter } from './adapters/mail.adapter';
import { StripeAdapter } from './adapters/stripe.adapter';

import { UserUtils } from 'src/functionalities/users/utils/user.utils';
import { Utils, HandleErrors } from './utils/utils';
import { MailsUtil } from './utils/mails.util';

@Module({
  providers: [
    // OpenAiAdapter,
    MailAdapter,
    AxiosAdapter,
    CloudAdapter,
    DayJSAdapter,
    StripeAdapter,
    HandleErrors,
    MailsUtil,
    UserUtils,
    Utils
  ],
  exports: [
    // OpenAiAdapter,
    MailAdapter,
    AxiosAdapter,
    CloudAdapter,
    DayJSAdapter,
    StripeAdapter,
    HandleErrors,
    MailsUtil,
    UserUtils,
    Utils
  ],
})
export class CommonModule {}
