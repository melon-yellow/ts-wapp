/*
##########################################################################################################################
#                                                            CHAT                                                        #
##########################################################################################################################
*/

// Imports
import type Bot from '../index.js'
import type { IMessage } from './types.js'

// Import Super-Guard
import { is } from 'ts-misc/dist/utils/guards.js'

// Import Misc Types
import type * as M from 'ts-misc/dist/utils/types'

/*
##########################################################################################################################
#                                                         CHAT CLASS                                                     #
##########################################################################################################################
*/

// Defines Chat Object
export default class Chat {
  bot: Bot

  constructor (bot: Bot) {
    Object.defineProperty(this, 'bot',
      { get() { return bot } }
    )
  }

  // Cycle Reference
  get chat() { return this }
  get misc() { return this.bot.misc }

  // Clean Message
  clean(message: string | IMessage, lower = true): string {
    let str: string = ''
    if (is.string(message)) str = message
    else str = message.body
    str = lower ? str.toLowerCase() : str
    str = str.replace(`@${this.bot.me.user}`, '')
    while (str.includes('  ')) str = str.replace('  ', ' ')
    str = str.trim()
    str = str.normalize('NFD')
    str = str.replace(/[\u0300-\u036f]/g, '')
    return str
  }

  /*
  ##########################################################################################################################
  #                                                       CHAT GETTERS                                                     #
  ##########################################################################################################################
  */

  get timeGreet() {
    const h = new Date().getHours()
    const g = {
      6: 'Bom dia ????',
      12: 'Bom dia',
      18: 'Boa tarde',
      24: 'Boa noite'
    } as const
    for (const i in g) {
      if (h < Number(i)) {
        return g[i] as M.ValueOf<typeof g>
      }
    }
  }

  get hi() {
    return this.misc.sets.rand(['Opa!!', 'Ola!', 'Oi!'] as const)
  }

  get done() {
    return this.misc.sets.rand(['Pronto!', 'Certo!', 'Ok!'] as const)
  }

  get gotIt() {
    const hi = this.misc.sets.rand([this.chat.hi, this.chat.hi, ''] as const)
    const git = this.misc.sets.rand(['?? pra j??! ????', 'entendido! ????', 'Ok! ????',
      'como desejar! ????', 'deixa comigo! ????', 'pode deixar! ????'
    ] as const)
    // Assembly
    return this.misc.string.join([
      hi, (hi === '' ? '' : ' '), this.timeGreet, ', ', git
    ] as const, '')
  }

  get gotMention() {
    const ack = this.misc.sets.rand(['?????????????', '????'] as const)
    const me = this.misc.sets.rand(['Eu', 'Aqui'] as const)
    // Assembly
    return this.misc.string.join([ack, ' ', me] as const, '')
  }

  get askPython() {
    const chat = this
    const misc = this.misc
    return {
      get asking() {
        const hi = misc.sets.rand([chat.hi, chat.hi, ''] as const)
        const wait = misc.sets.rand([
          ', certo', ', espera um pouquinho', '',
          ', s?? um momento', ', Ok', ', um instante'
        ] as const)
        const lure = misc.sets.rand([
          'vou verificar o que voc?? est?? querendo ????',
          'vou analisar melhor o que voc?? pediu ????',
          'vou analisar aqui o que voc?? est?? querendo ????',
          'vou procurar aqui o que voc?? pediu ????'
        ] as const)
        // Assembly
        return misc.string.join([
          hi, (hi === '' ? '' : ' '), chat.timeGreet, wait, ', ', lure
        ] as const, '')
      },
      get finally() {
        return misc.sets.rand([
          'Veja o que eu encontrei ????', 'Eu encontrei o seguinte ????',
          'Olha a?? o que achei pra voc?? ????', 'Isso foi o que eu encontrei ????',
          'Olha s?? o que eu encontrei ????', 'Eu encontrei isso aqui ????'
        ] as const)
      }
    }
  }

  get error() {
    const misc = this.misc
    return {
      get network () {
        const msg = misc.sets.rand(['Ocorreu um erro enquanto eu buscava os dados!',
          'Oops, algo deu Errado!', 'N??o pude acessar os dados!'
        ] as const)
        const flt = misc.sets.rand(['???? deve ter algum sistema fora do ar',
          '???? meus servidores devem estar offline',
          '???? deve ter caido alguma conex??o minha'
        ] as const)
        // Assembly
        return misc.string.join([msg, ' ', flt] as const, '')
      }
    }
  }
}

/*
##########################################################################################################################
#                                                           END                                                          #
##########################################################################################################################
*/
