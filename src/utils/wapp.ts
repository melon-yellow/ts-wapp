/*
##########################################################################################################################
#                                                         WHATSAPP                                                       #
##########################################################################################################################
*/

// Import Venom
import Venom from 'venom-bot'

// Import Interface Class
import Client from './client/index.js'

// Import Super-Guard
import { is } from 'ts-misc/dist/utils/guards.js'

// Import Bot Types
import Bot from '../index.js'
import type {
  TExec,
  TAExec,
  TFetchString,
  IMessage,
  ITarget,
  WappHostDevice
} from './types.js'

/*
##########################################################################################################################
#                                                         WHAPP CLASS                                                    #
##########################################################################################################################
*/

// Check Target Object
export function isWhatsappTarget(
  obj: unknown
): obj is ITarget {
  if (!is.object(obj)) return false
  if (!is.string.in(obj, ['address', 'user', 'password'])) return false
  return true
}

/*
##########################################################################################################################
#                                                         WHAPP CLASS                                                    #
##########################################################################################################################
*/

export default class Wapp {
  bot: Bot
  contacts: Record<string, string>
  replyables: Record<string, TAExec>
  client: Client
  target: ITarget | null

  constructor (target: ITarget | Bot) {
    // Check Input
    if (isWhatsappTarget(target)) {
      this.target = target
    } else if (target instanceof Bot) {
      this.target = null
      Object.defineProperty(this, 'bot',
        { get() { return target } }
      )
    }
    // Instance Client
    this.client = new Client(this.bot)
    // Set Contacts List
    this.contacts = {}
    // Set Replyables List
    this.replyables = {}
  }

  // Cycle Reference
  get wapp() { return this }
  get misc() { return this.bot.misc }

  /*
  ##########################################################################################################################
  #                                                     EXECUTION METHODS                                                  #
  ##########################################################################################################################
  */

  // Add On-Reply Action
  addReplyable(p: { id: string, do: TExec }): boolean {
    const { id } = p
    if (!is.string(id)) throw new Error(`(V432) invalid argument "id": ${this.misc.sets.serialize(id)}`)
    if (!is.function(p.do)) throw new Error(`(U74H) invalid argument "do": ${this.misc.sets.serialize(p.do)}`)
    this.replyables[id] = this.misc.handle.safe(p.do)
    return true
  }

  // Get Venom-Bot Host
  async getHostDevice(): Promise<WappHostDevice> {
    return this.client.getHostDevice()
  }

  // Get Message
  async getMessageById(id: string): Promise<IMessage> {
    if (!is.string(id)) throw new Error(`(FF42) invalid argument "id": ${this.misc.sets.serialize(id)}`)
    return this.client.getMessageById(id)
  }

  // Add Action
  get add(): (typeof Client.prototype.add) {
    return this.client.add
  }

  // Start Wapp
  async start(session: string): Promise<boolean> {
    if (!is.null(this.target)) throw new Error('(452G) target reference selected: you should not start venom')
    return this.client.start(session)
  }

  // Venom-Bot Started
  get started(): boolean {
    return this.client.started
  }

  /*
  ##########################################################################################################################
  #                                                    AUXILIARY METHODS                                                   #
  ##########################################################################################################################
  */

  // fetch data for message
  async fetch(data: TFetchString): Promise<string> {
    // Set Resolution Variable
    let resolution: string = null
    // check type-of input
    if (is.string(data)) resolution = data
    else if (is.promise(data)) resolution = await data
    else if (is.function(data)) {
      const preRes = data()
      if (is.string(preRes)) resolution = preRes
      else if (is.promise(preRes)) resolution = await preRes
    }
    // check type-of output
    if (!is.string(resolution)) resolution = null
    // return text
    return resolution
  }

  // Get Contact Number by Name
  getContactByName(to: string, flag?: number): string {
    let contact = `${to}`
    // Get Contacts List
    let contacts = this.misc.sets.serialize(
      this.contacts
    )
    // Switch Key-Value Pairs
    if (flag === -1) {
      contacts = Object.entries(contacts)
        .reduce((ret, entry) => {
          const [key, value] = entry
          ret[value] = key
          return ret
        }, {})
    }
    // replace cyclicaly
    while (Object.keys(contacts).includes(contact)) {
      contact = contacts[contact]
    }
    // return result
    return contact
  }

  /*
  ##########################################################################################################################
  #                                                    MESSAGE CONSTRUCTOR                                                 #
  ##########################################################################################################################
  */

  // Message Constructor
  setMessage(sent: Venom.Message): IMessage {
    // Prevent Empty Message Objects
    if (!is.object(sent)) throw new Error(`(T78J) invalid argument "sent": ${this.misc.sets.serialize(sent)}`)
    // Fix Author on Private Messages
    if (!sent.isGroupMsg) sent.author = sent.from
    // Allow Cyclic Reference
    const wapp = this
    // Assign Message Properties
    const message = Object.defineProperties(
      {} as IMessage,
      {
        ...Object.getOwnPropertyDescriptors(sent),
        ...Object.getOwnPropertyDescriptors({
          // Wapp
          get wapp () { return wapp },
          // Set Properties
          id: sent.id,
          body: sent.body,
          // Fix Contact Names
          from: wapp.getContactByName(sent.from, -1),
          author: wapp.getContactByName(sent.author, -1),
          // Fix Quoted Message Object
          quotedMsg: (
            is.object.in(sent, 'quotedMsgObj')
              ? wapp.setMessage(sent.quotedMsgObj)
              : null
          ),
          quotedMsgObj: sent.quotedMsgObj,
          // Send Message to Chat
          async send(p: {
            text?: TFetchString,
            log?: TFetchString,
            quote?: TFetchString
          }): Promise<IMessage> {
            return this.wapp.send({
              to: this.from,
              text: p.text,
              log: p.log,
              quote: p.quote
            })
          },
          // Quote Message
          async quote(p: {
            text?: TFetchString,
            log?: TFetchString
          }): Promise<IMessage> {
            return this.send({
              text: p.text,
              log: p.log,
              quote: this.id
            })
          },
          // Set On-Reply Action
          get on() {
            return {
              reply(execute: TExec) {
                if (!is.function(execute)) throw new Error(`(4RCD) invalid argument "execute": ${this.misc.sets.serialize(sent)}`)
                wapp.addReplyable({
                  id: sent.id,
                  do: execute
                })
                return true
              }
            }
          },
          // Clean Message Text
          clean(): string {
            return wapp.bot.chat.clean(this.body)
          }
        })
      }
    )
    // return Message Object
    return message
  }

  /*
  ##########################################################################################################################
  #                                                       SEND MESSAGE                                                     #
  ##########################################################################################################################
  */

  // Send Message Method
  async send(p: {
    to: TFetchString,
    text?: TFetchString,
    log?: TFetchString,
    quote?: TFetchString
  }): Promise<IMessage> {
    // check if bot has started
    if (!this.client.started) throw new Error('(TH3E) bot not started')
    // fetch text data
    let to = await this.fetch(p.to)
    let text = await this.fetch(p.text)
    let log = await this.fetch(p.log)
    const quote = await this.fetch(p.quote)
    // check params consistency
    if (!is.string(to)) throw new Error(`(YJ87) invalid argument "to": ${this.misc.sets.serialize(to)}`)
    if (!is.string.or.null(text)) throw new Error(`(RTHE) invalid argument "text": ${this.misc.sets.serialize(text)}`)
    if (!is.string.or.null(log)) throw new Error(`(GH5H) invalid argument "log": ${this.misc.sets.serialize(log)}`)
    if (!is.string.or.null(quote)) throw new Error(`(867G) invalid argument "quote": ${this.misc.sets.serialize(quote)}`)
    // fix parameters
    text = text || ''
    log = log || 'wapp::send'
    // get number from contacts
    to = this.getContactByName(to)
    // send message
    const result = (quote
      ? await this.misc.handle.safe(
        this.client.sendReply,
        this.client
      )({ to: to, text: text, quote: quote })
      : await this.misc.handle.safe(
        this.client.sendText,
        this.client
      )({ to: to, text: text })
    )
    // set message object
    const [data, sendMessageError] = result
    // check for error
    if (sendMessageError) {
      await this.bot.log(`Throw(wapp::send) Catch(${sendMessageError})`)
      throw sendMessageError
    }
    if (!is.object(data)) {
      throw new Error(
        `(35RT) invalid response from sendMessage: ${this.misc.sets.serialize(data)}`
      )
    }
    // on success
    await this.bot.log(`Sent(${log}) To(${to})`)
    const sent = this.setMessage(data)
    // return message
    return sent
  }

  // Safe Send Message Method
  async sends(p: {
    to: TFetchString,
    text?: TFetchString,
    log?: TFetchString,
    quote?: TFetchString
  }) {
    const send = this.misc.handle.safe(this.send, this)
    return send(p)
  }
}

/*
##########################################################################################################################
#                                                           END                                                          #
##########################################################################################################################
*/
