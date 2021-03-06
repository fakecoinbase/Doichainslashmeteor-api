import {Meteor} from "meteor/meteor";
import {network} from "doichain"
import './imports/startup/server/doichain-configuration';
import './server/main.js';
export const name = 'doichain-meteor-api';
import {OptIns} from "./imports/api/opt-ins/opt-ins";
import {Recipients} from "./imports/api/recipients/recipients";
import {Senders} from "./imports/api/senders/senders";
import {Meta} from "./imports/api/meta/meta";
import {getUrl, isRegtest, isTestnet} from "./imports/startup/server/dapp-configuration";

import {getHttpGET, getHttpGETdata, getHttpPOST,getHttpPUT} from "./server/api/http";
import {testLogging} from "./imports/startup/server/log-configuration";


export let OptInsCollection = OptIns;
export let RecipientsCollection = Recipients;
export let SendersCollection = Senders;
export let MetaCollection = Meta;

export let httpGET = getHttpGET;
export let httpGETdata = getHttpGETdata;
export let httpPOST = getHttpPOST;
export let httpPUT = getHttpPUT;
export let getServerUrl = getUrl;
export let testLog = testLogging;
export let regtest = isRegtest()

Meteor.startup(() => {
    if (Meteor.isServer) {

        if(isTestnet()) network.changeNetwork('testnet')
        else if(isRegtest()) network.changeNetwork('regtest')
        else network.changeNetwork('mainnet')

        console.log("dapp running " + (isTestnet() ? 'testnet' : '') + '' + (isRegtest() ? 'regtest' : ''));
    }
});

