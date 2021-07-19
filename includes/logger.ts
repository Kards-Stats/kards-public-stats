import * as logger from 'winston'
import 'winston-daily-rotate-file'
import { isMaster } from 'cluster'
import _ from 'underscore'
import { SPLAT } from 'triple-beam'

const SPLAT_STRING: string = SPLAT as any

const loggers = new Map()

function formatObject (param: Object | string): string {
  if (_.isObject(param)) {
    return JSON.stringify(param)
  }
  return param
}

// Ignore log messages if they have { private: true }
const all = logger.format((info: any) => {
  if (info instanceof Error) {
    return Object.assign({
      message: info.message,
      stack: info.stack
    }, info)
  }
  const splat = info[SPLAT_STRING] ?? []
  const message = formatObject(info.message)
  const rest: string = splat.map(formatObject).join(' ')
  info.message = `${message} ${rest}`
  return info
})

interface CustomTransformableInfo extends logger.Logform.TransformableInfo {
  timestamp: string
  label: string
}

function getConfig (label: string): logger.LoggerOptions {
  return {
    levels: {
      error: 1,
      warn: 2,
      info: 3,
      debug: 4,
      silly: 5
    },
    format: logger.format.combine(
      all(),
      logger.format.json()
    ),
    transports: [
      new logger.transports.Console({
        level: process.env.console_level ?? process.env.log_level ?? 'error',
        format: logger.format.combine(
          logger.format.colorize(),
          logger.format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
          logger.format.label({ label: label }),
          logger.format.errors({ stack: true }),
          logger.format.printf((msg) => {
            const msgTyped: CustomTransformableInfo = msg as CustomTransformableInfo
            return `[${msgTyped.timestamp}][${msgTyped.label}][${msgTyped.level}]: ${msgTyped.message}`
          })
        )
      }),
      new logger.transports.DailyRotateFile({
        level: process.env.log_level ?? 'info',
        filename: [process.cwd(), 'logs/console.rotating.log'].join('/'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        format: logger.format.combine(
          logger.format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
          logger.format.label({ label: label }),
          logger.format.errors({ stack: true }),
          logger.format.printf((msg) => {
            const msgTyped: CustomTransformableInfo = msg as CustomTransformableInfo
            return `[${msgTyped.timestamp}][${msgTyped.label}][${msgTyped.level}]: ${msgTyped.message}`
          })
        )
      })/*,
            new transports.File({
                level: process.env.log_level || 'info',
                format: format.combine(
                    format.timestamp({ format: "DD-MM-YYYY HH:mm:ss" }),
                    format.label({ label: label }),
                    format.json()
                ),
                filename: [process.cwd(), `logs/console.all.log`].join('/'),
            }), */
    ]
  }
}

export function getLogger (fork: string, name: string): logger.Logger | null {
  const builtName = `${fork} - ${name}`
  if (loggers.has(builtName)) {
    return loggers.get(builtName)
  }
  const result = logger.createLogger(getConfig(builtName))
  loggers.set(builtName, result)
  return result
}

export function getCurrentLogger (name: string): logger.Logger {
  let fork = process.env.name
  if (fork === undefined && !isMaster) { fork = `Fork ${process.env.FORK_ID ?? ''}` }
  if (fork === undefined) { fork = 'master' }
  const logger = getLogger(fork, name)
  if (logger === null) { throw new Error('No Logger available') }
  return logger
}
