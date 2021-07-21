import * as logger from 'winston'
import 'winston-daily-rotate-file'
import { isMaster } from 'cluster'
import _ from 'underscore'
import { SPLAT } from 'triple-beam'

const SPLAT_STRING: string = SPLAT as any

var loggers = new Map()

function formatObject (param: any): string {
  if (_.isObject(param)) {
    if (_.has(param, 'message')) {
      return param.message
    }
    return JSON.stringify(param)
  }
  if (param === undefined) {
    return 'undefined'
  }
  if (param === null) {
    return 'null'
  }
  return param.toString()
}

// Ignore log messages if they have { private: true }
const all = logger.format((info: any) => {
  const splat: any[] = info[SPLAT_STRING] ?? []
  const message = formatObject(info.message)
  const rest: string = splat.map(formatObject).join(' ')
  info.message = `${message} ${rest}`.trim()
  return info
})

interface CustomTransformableInfo extends logger.Logform.TransformableInfo {
  timestamp: string
  label: string
}

const levels = [
  'error',
  'warn',
  'info',
  'debug',
  'silly'
]

export function getConfig (label: string): logger.LoggerOptions {
  var consoleLevel = process.env.console_level ?? process.env.log_level ?? ''
  /* istanbul ignore else */
  if (!levels.includes(consoleLevel)) {
    consoleLevel = process.env.log_level ?? ''
    /* istanbul ignore else */
    if (!levels.includes(consoleLevel)) {
      consoleLevel = 'error'
    }
  }
  var logLevel = process.env.log_level ?? ''
  /* istanbul ignore else */
  if (!levels.includes(logLevel)) {
    logLevel = 'info'
  }
  var levelsObj: logger.config.AbstractConfigSetLevels = {}
  for (var i = 0; i < levels.length; i++) {
    levelsObj[levels[i]] = i + 1
  }
  /* istanbul ignore next */
  return {
    levels: levelsObj,
    format: logger.format.combine(
      all(),
      logger.format.json()
    ),
    transports: [
      new logger.transports.Console({
        level: consoleLevel,
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
        level: logLevel,
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
      })
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
  const logger = getLogger(getForkName(isMaster), name)
  if (logger === null) { throw new Error('No Logger available') }
  return logger
}

export function getForkName (isMaster: boolean): string {
  /* istanbul ignore else */
  if (process.env.name === undefined) {
    /* istanbul ignore else */
    if (isMaster === undefined || isMaster === null || isMaster) {
      return 'master'
    }
    /* istanbul ignore next */
    return `Fork ${process.env.FORK_ID ?? ''}`.trim()
  }
  /* istanbul ignore next */
  return process.env.name
}
