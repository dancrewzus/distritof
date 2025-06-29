import { Injectable } from '@nestjs/common';
import envConfig from '../../config/env.config';
import Stripe from 'stripe';


@Injectable()
export class StripeAdapter {
    constructor() {}
    
    private initInstance = (): Stripe => {
        return new Stripe(envConfig().stripeApiKey);
    }

    /**
     * Create Payment Intent
     * DOCS: https://docs.stripe.com/api/payment_intents/create
     */
    public createPaymentIntent = async (amount: number, currency: string) => {
        const stripe = this.initInstance();

        return stripe.paymentIntents.create({
            amount: parseFloat(`${ amount }`),
            currency: currency.toLowerCase(),
            payment_method_types: ['card'],
        });
    }

    /**
     * Retrieve Payment Intent
     * DOCS: https://docs.stripe.com/api/payment_intents/retrieve
     */
    public getPaymentIntent = async (paymentIntentId: string) => {
        const stripe = this.initInstance();

        return stripe.paymentIntents.retrieve(paymentIntentId);
    }
}