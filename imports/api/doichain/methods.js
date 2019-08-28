import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import {getSettings} from "meteor/doichain:settings";
import getKeyPairM from '../../modules/server/doichain/get_key-pair.js';
import getBalanceM from '../../modules/server/doichain/get_balance.js';
import sendToAddressM from '../../modules/server/doichain/send_to_address';
import addOptIn from "../../modules/server/opt-ins/add_and_write_to_blockchain";
import {logConfirm} from "../../startup/server/log-configuration";
import scan_Doichain from "../../modules/server/doichain/scan_doichain";
import {generateBlock} from "../../../server/api/doichain";
import {CONFIRM_CLIENT} from "../../startup/server/doichain-configuration";


const generate = new ValidatedMethod({
  name: 'doichain.generate',
  validate: null,
  run({blocks}) {

    logConfirm("generating a block in case its regtest");

    if(!Roles.userIsInRole(this.userId, ['admin'])) {
      const error = "api.doichain.generate.accessDenied";
      throw new Meteor.Error(error, i18n.__(error));
    }
    return generateBlock(CONFIRM_CLIENT, blocks)
  },
});

const rescan = new ValidatedMethod({
  name: 'doichain.rescan',
  validate: null,
  run() {
    logConfirm("rescanning blockchain");
    if(!Roles.userIsInRole(this.userId, ['admin'])) {
      const error = "api.doichain.rescan.accessDenied";
      throw new Meteor.Error(error, i18n.__(error));
    }
    scan_Doichain(true)
    return "rescanning done"
  },
});


const sendToAddress = new ValidatedMethod({
  name: 'doichain.sendToAddress',
  validate: null,
  run({address,amount}) {
    console.log(`sendToAddress address:${address} amount:${amount} `)
    if(!this.userId) {
      const error = "api.doichain.sendToAddress.accessDenied";
      throw new Meteor.Error(error, i18n.__(error));
    }
    sendToAddressM(address,amount);
    return "okey"
  },
});

const requestEmailPermission = new ValidatedMethod({
  name: 'doichain.requestEmailPermission',
  validate: null,
  run({senderEmail,recipientMail}) {
    console.log(`requestEmailPermission ${senderEmail} / ${recipientMail}`)
    if(!this.userId) {
      const error = "api.doichain.requestEmailPermission.accessDenied";
      throw new Meteor.Error(error, i18n.__(error));
    }

    const defaultFrom =  getSettings('confirm.smtp.defaultFrom','doichain@localhost');
    //if given in form please take it otherwise take email of the current user, if not available to the default email of this dApp
    const our_senderMail = senderEmail?senderEmail:(Meteor.user().emails && Meteor.user().emails.length>0)?Meteor.user().emails[0].address:defaultFrom
    const optIn = {
      "recipient_mail": recipientMail,
      "sender_mail": our_senderMail,
      "ownerId": this.userId
    }

    return addOptIn(optIn)
  },
});

const getKeyPair = new ValidatedMethod({
  name: 'doichain.getKeyPair',
  validate: null,
  run() {
    return getKeyPairM();
  },
});

/**TODO this can be removed - if not longer important since we import balance durinng blocknotify and status call from outside*/
const getBalance = new ValidatedMethod({
  name: 'doichain.getBalance',
  validate: null,
  run() {
    const logVal = getBalanceM();
    return logVal;
  },
});


// Get list of all method names on doichain
const OPTIONS_METHODS = _.pluck([
    generate,
    rescan,
    sendToAddress,
    requestEmailPermission,
    getKeyPair,
    getBalance], 'name');

if (Meteor.isServer) {
  // Only allow 5 opt-in operations per connection per second
  DDPRateLimiter.addRule({
    name(name) {
      return _.contains(OPTIONS_METHODS, name);
    },

    // Rate limit per connection ID
    connectionId() { return true; },
  }, 5, 1000);
}
