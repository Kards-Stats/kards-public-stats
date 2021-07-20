import winston from 'winston'
import rewire from 'rewire'
import path from 'path'
import { SPLAT, LEVEL, MESSAGE } from 'triple-beam'

const SPLAT_STRING: string = SPLAT as any
const LEVEL_STRING: string = LEVEL as any
const MESSAGE_STRING: string = MESSAGE as any

describe('getLogger', () => {
  var rewiredLogger = rewire('../../includes/logger')
  beforeEach(() => {
    rewiredLogger.__set__({ loggers: new Map() })
  })
  it('Should create logger', () => {
    var logger: winston.Logger | null = rewiredLogger.getLogger('a', 'b')
    expect(logger).toBeDefined()
  })
})

describe('getLogger Mocked', () => {
  var rewiredLogger = rewire('../../includes/logger')
  var mockCreateConfig: jest.Mock
  var mockLoggers: {
    set: jest.Mock
    has: jest.Mock
    get: jest.Mock
  }
  beforeAll(() => {
    mockCreateConfig = jest.fn((name: string) => {
      return { name: name }
    })
    mockLoggers = {
      set: jest.fn((name: string, value: any) => {
        if (name === 'yes - yes') {
          return (new Map()).set('yes - yes', value)
        }
        return new Map()
      }),
      get: jest.fn((name: string) => {
        if (name === 'yes - yes') {
          return winston.createLogger()
        }
        return null
      }),
      has: jest.fn((name: string) => {
        if (name === 'yes - yes') {
          return true
        }
        return false
      })
    }
    rewiredLogger.__set__({
      getConfig: mockCreateConfig,
      loggers: mockLoggers
    })
  })
  beforeEach(() => {
    mockCreateConfig.mockClear()
    mockLoggers.set.mockClear()
    mockLoggers.get.mockClear()
    mockLoggers.has.mockClear()
  })
  it('Should create logger', () => {
    var logger: winston.Logger | null = rewiredLogger.getLogger('no', 'no')
    var title = 'no - no'
    expect(mockCreateConfig.mock.calls.length).toBe(1)
    expect(mockCreateConfig.mock.calls[0][0]).toBe(title)
    expect(mockLoggers.has.mock.calls.length).toBe(1)
    expect(mockLoggers.has.mock.calls[0][0]).toBe(title)
    expect(mockLoggers.set.mock.calls.length).toBe(1)
    expect(mockLoggers.set.mock.calls[0][0]).toBe(title)
    expect(mockLoggers.set.mock.calls[0][1]).toBeDefined()
    expect(mockLoggers.get.mock.calls.length).toBe(0)
    expect(logger).toBeDefined()
  })
  it('Should use existing logger', () => {
    var logger: winston.Logger | null = rewiredLogger.getLogger('yes', 'yes')
    var title = 'yes - yes'
    expect(mockCreateConfig.mock.calls.length).toBe(0)
    expect(mockLoggers.has.mock.calls.length).toBe(1)
    expect(mockLoggers.has.mock.calls[0][0]).toBe(title)
    expect(mockLoggers.set.mock.calls.length).toBe(0)
    expect(mockLoggers.get.mock.calls.length).toBe(1)
    expect(mockLoggers.get.mock.calls[0][0]).toBe(title)
    expect(logger).toBeDefined()
  })
})

describe('getCurrentLogger', () => {
  var rewiredLogger = rewire('../../includes/logger')
  beforeEach(() => {
    rewiredLogger.__set__({ loggers: new Map() })
  })
  it('Should create logger', () => {
    var logger: winston.Logger | null = rewiredLogger.getCurrentLogger('a')
    expect(logger).toBeDefined()
  })
})

describe('getCurrentLogger Mocked', () => {
  it('Should get master', () => {
    const mockGetLogger = jest.fn((fork: string, name: string) => {
      return { fork: fork, name: name }
    })
    const mockGetForkName = jest.fn(() => {
      return 'master'
    })
    const rewiredLogger = rewire(path.join(__dirname, '../../includes/logger'))
    rewiredLogger.__set__({
      getLogger: mockGetLogger,
      getForkName: mockGetForkName
    })
    var logger: winston.Logger | null = rewiredLogger.getCurrentLogger('no')
    expect(mockGetLogger.mock.calls.length).toBe(1)
    expect(mockGetForkName.mock.calls.length).toBe(1)
    expect(mockGetLogger.mock.calls[0][0]).toBe('master')
    expect(mockGetLogger.mock.calls[0][1]).toBe('no')
    expect(logger).toBeDefined()
  })
  it('Should get name', () => {
    const mockGetLogger = jest.fn((fork: string, name: string) => {
      return { fork: fork, name: name }
    })
    const mockGetForkName = jest.fn(() => {
      return 'name'
    })
    const rewiredLogger = rewire(path.join(__dirname, '../../includes/logger'))
    rewiredLogger.__set__({
      getLogger: mockGetLogger,
      getForkName: mockGetForkName
    })
    var logger: winston.Logger | null = rewiredLogger.getCurrentLogger('no')
    expect(mockGetLogger.mock.calls.length).toBe(1)
    expect(mockGetForkName.mock.calls.length).toBe(1)
    expect(mockGetLogger.mock.calls[0][0]).toBe('name')
    expect(mockGetLogger.mock.calls[0][1]).toBe('no')
    expect(logger).toBeDefined()
  })
  it('Should get fork name', () => {
    const mockGetLogger = jest.fn((fork: string, name: string) => {
      return { fork: fork, name: name }
    })
    const mockGetForkName = jest.fn(() => {
      return 'Fork 1'
    })
    const rewiredLogger = rewire(path.join(__dirname, '../../includes/logger'))
    rewiredLogger.__set__({
      getLogger: mockGetLogger,
      getForkName: mockGetForkName
    })
    var logger: winston.Logger | null = rewiredLogger.getCurrentLogger('no')
    expect(mockGetLogger.mock.calls.length).toBe(1)
    expect(mockGetForkName.mock.calls.length).toBe(1)
    expect(mockGetLogger.mock.calls[0][0]).toBe('Fork 1')
    expect(mockGetLogger.mock.calls[0][1]).toBe('no')
    expect(logger).toBeDefined()
  })
  it('Should throw on null', () => {
    const nullFunc = jest.fn((_1, _2) => null)
    const mockGetForkName = jest.fn(() => null)
    const rewiredLogger = rewire(path.join(__dirname, '../../includes/logger'))
    rewiredLogger.__set__({
      getLogger: nullFunc,
      getForkName: mockGetForkName
    })
    expect(rewiredLogger.getCurrentLogger.bind(rewiredLogger, 'no')).toThrow()
    expect(nullFunc.mock.calls.length).toBe(1)
    expect(mockGetForkName.mock.calls.length).toBe(1)
  })
})

describe('getForkName', () => {
  var rewiredLogger = rewire('../../includes/logger')
  beforeEach(() => {
    rewiredLogger.__set__({ loggers: new Map() })
  })
  it('Should create logger', () => {
    var logger: winston.Logger | null = rewiredLogger.getCurrentLogger('a')
    expect(logger).toBeDefined()
  })
})

describe('getForkName Mocked', () => {
  const OLD_ENV = process.env
  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV }
  })
  afterAll(() => {
    process.env = OLD_ENV
  })
  it('Should get master', () => {
    process.env.name = undefined
    const rewiredLogger = require('../../includes/logger')
    var name: string = rewiredLogger.getForkName()
    expect(name).toBeDefined()
    expect(name).toBe('master')
  })
  it('Should get name', () => {
    process.env.name = 'name'
    const rewiredLogger = require('../../includes/logger')
    var name: string = rewiredLogger.getForkName()
    expect(name).toBeDefined()
    expect(name).toBe('name')
  })
  it('Should get master if isMaster', () => {
    process.env.name = undefined
    process.env.FORK_ID = '1'
    process.env.NODE_UNIQUE_ID = '1'
    process.env.NODE_WORKER_ID = '1'
    const rewiredLogger = require('../../includes/logger')
    var name: string = rewiredLogger.getForkName(true)
    expect(name).toBeDefined()
    expect(name).toBe('master')
  })
  it('Should get fork name', () => {
    process.env.name = undefined
    process.env.FORK_ID = '1'
    process.env.NODE_UNIQUE_ID = '1'
    process.env.NODE_WORKER_ID = '1'
    const rewiredLogger = require('../../includes/logger')
    var name: string = rewiredLogger.getForkName(false)
    expect(name).toBeDefined()
    expect(name).toBe('Fork 1')
  })
  it('Should get fork name empty', () => {
    process.env.name = undefined
    process.env.FORK_ID = undefined
    process.env.NODE_UNIQUE_ID = undefined
    process.env.NODE_WORKER_ID = undefined
    const rewiredLogger = require('../../includes/logger')
    var name: string = rewiredLogger.getForkName(false)
    expect(name).toBeDefined()
    expect(name).toBe('Fork')
  })
  it('Should get master when null', () => {
    process.env.name = undefined
    process.env.FORK_ID = undefined
    process.env.NODE_UNIQUE_ID = undefined
    process.env.NODE_WORKER_ID = undefined
    const rewiredLogger = require('../../includes/logger')
    var name: string = rewiredLogger.getForkName(null)
    expect(name).toBeDefined()
    expect(name).toBe('master')
  })
})

describe('getConfig Mocked', () => {
  const OLD_ENV = process.env
  const levels = ['error', 'warn', 'info', 'debug', 'silly']
  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV }
  })
  afterAll(() => {
    process.env = OLD_ENV
  })
  it('Should set default levels', () => {
    process.env.log_level = undefined
    process.env.console_level = undefined
    const rewiredLogger = require('../../includes/logger')
    const title = 'test'
    var name: winston.LoggerOptions = rewiredLogger.getConfig(title)
    expect(name.levels).toBeDefined()
    for (var level of levels) {
      expect(name.levels).toHaveProperty(level)
    }
    expect(name.format).toBeDefined()
    expect(name.transports).toBeDefined()
    if (name.transports !== undefined) {
      const transportArray = ([] as winston.transport[]).concat(name.transports)
      expect(transportArray.length).toBeGreaterThan(1)
      for (var transport of transportArray) {
        if (transport instanceof winston.transports.Console) {
          expect(transport.level).toBe('error')
        } else {
          expect(transport.level).toBe('info')
        }
      }
    }
  })
  it('Should set log levels', () => {
    process.env.log_level = 'silly'
    process.env.console_level = undefined
    const rewiredLogger = require('../../includes/logger')
    const title = 'test'
    var name: winston.LoggerOptions = rewiredLogger.getConfig(title)
    expect(name.levels).toBeDefined()
    for (var level of levels) {
      expect(name.levels).toHaveProperty(level)
    }
    expect(name.format).toBeDefined()
    expect(name.transports).toBeDefined()
    if (name.transports !== undefined) {
      const transportArray = ([] as winston.transport[]).concat(name.transports)
      expect(transportArray.length).toBeGreaterThan(1)
      for (var transport of transportArray) {
        if (transport instanceof winston.transports.Console) {
          expect(transport.level).toBe('silly')
        } else {
          expect(transport.level).toBe('silly')
        }
      }
    }
  })
  it('Should set seperate levels', () => {
    process.env.log_level = 'silly'
    process.env.console_level = 'debug'
    const rewiredLogger = require('../../includes/logger')
    const title = 'test'
    var name: winston.LoggerOptions = rewiredLogger.getConfig(title)
    expect(name.levels).toBeDefined()
    for (var level of levels) {
      expect(name.levels).toHaveProperty(level)
    }
    expect(name.format).toBeDefined()
    expect(name.transports).toBeDefined()
    if (name.transports !== undefined) {
      const transportArray = ([] as winston.transport[]).concat(name.transports)
      expect(transportArray.length).toBeGreaterThan(1)
      for (var transport of transportArray) {
        if (transport instanceof winston.transports.Console) {
          expect(transport.level).toBe('debug')
        } else {
          expect(transport.level).toBe('silly')
        }
      }
    }
  })
  it('Should revert to log on console invalid level', () => {
    process.env.log_level = 'silly'
    process.env.console_level = 'invalid'
    const rewiredLogger = require('../../includes/logger')
    const title = 'test'
    var name: winston.LoggerOptions = rewiredLogger.getConfig(title)
    expect(name.levels).toBeDefined()
    for (var level of levels) {
      expect(name.levels).toHaveProperty(level)
    }
    expect(name.format).toBeDefined()
    expect(name.transports).toBeDefined()
    if (name.transports !== undefined) {
      const transportArray = ([] as winston.transport[]).concat(name.transports)
      expect(transportArray.length).toBeGreaterThan(1)
      for (var transport of transportArray) {
        if (transport instanceof winston.transports.Console) {
          expect(transport.level).toBe('silly')
        } else {
          expect(transport.level).toBe('silly')
        }
      }
    }
  })
  it('Should revert to default levels', () => {
    process.env.log_level = 'invalid'
    process.env.console_level = 'invalid'
    const rewiredLogger = require('../../includes/logger')
    const title = 'test'
    var name: winston.LoggerOptions = rewiredLogger.getConfig(title)
    expect(name.levels).toBeDefined()
    for (var level of levels) {
      expect(name.levels).toHaveProperty(level)
    }
    expect(name.format).toBeDefined()
    expect(name.transports).toBeDefined()
    if (name.transports !== undefined) {
      const transportArray = ([] as winston.transport[]).concat(name.transports)
      expect(transportArray.length).toBeGreaterThan(1)
      for (var transport of transportArray) {
        if (transport instanceof winston.transports.Console) {
          expect(transport.level).toBe('error')
        } else {
          expect(transport.level).toBe('info')
        }
      }
    }
  })
})

describe('logging real', () => {
  const levels = ['error', 'warn', 'info', 'debug', 'silly']
  process.env.log_level = 'silly'
  process.env.console_level = 'silly'
  const logger = require('../../includes/logger').getCurrentLogger('tester')
  it('Should log all strings', () => {
    for (var level of levels) {
      logger[level]('This is a string')
    }
  })
  it('Should log all error objects', () => {
    for (var level of levels) {
      logger[level](new Error('This is a string'))
    }
  })
  it('Should log all objects', () => {
    for (var level of levels) {
      logger[level]({ name: 'This is a string', type: 'object' })
    }
  })
  it('Should log all undefined', () => {
    for (var level of levels) {
      logger[level](undefined)
    }
  })
  it('Should log all null', () => {
    for (var level of levels) {
      logger[level](null)
    }
  })
})

describe('All Format', () => {
  const rewiredLogger = rewire('../../includes/logger')
  const allFunc = rewiredLogger.__get__('all')()
  const level = 'silly'
  it('Should format strings', () => {
    const info = allFunc.transform({
      [LEVEL]: level,
      [SPLAT]: [],
      level: level,
      message: 'yeet'
    })
    expect(info[LEVEL]).toBe(level)
    expect(info[SPLAT]).toStrictEqual([])
    expect(info.level).toBe(level)
    expect(info.message).toBe('yeet')
  })
  it('Should format Errors', () => {
    const info = allFunc.transform(new Error('yeetError'))
    expect(info.message).toBe('yeetError')
  })
  it('Should format error splat', () => {
    const splatInfo = [new Error('yeetErro')]
    const info = allFunc.transform({
      [LEVEL]: level,
      [SPLAT]: splatInfo,
      level: level,
      message: 'yeet'
    })
    expect(info[LEVEL]).toBe(level)
    expect(info[SPLAT]).toStrictEqual(splatInfo)
    expect(info.level).toBe(level)
    expect(info.message).toBe('yeet yeetErro')
  })
  it('Should format error splat multiple', () => {
    const splatInfo = [new Error('yeetErro'), new Error('yeetError')]
    const info = allFunc.transform({
      [LEVEL]: level,
      [SPLAT]: splatInfo,
      level: level,
      message: 'yeet'
    })
    expect(info[LEVEL]).toBe(level)
    expect(info[SPLAT]).toStrictEqual(splatInfo)
    expect(info.level).toBe(level)
    expect(info.message).toBe('yeet yeetErro yeetError')
  })
  it('Should format undefined', () => {
    const info = allFunc.transform({
      [LEVEL]: level,
      [SPLAT]: [],
      level: level,
      message: undefined
    })
    expect(info[LEVEL]).toBe(level)
    expect(info[SPLAT]).toStrictEqual([])
    expect(info.level).toBe(level)
    expect(info.message).toBe('undefined')
  })
  it('Should format null', () => {
    const info = allFunc.transform({
      [LEVEL]: level,
      [SPLAT]: [],
      level: level,
      message: null
    })
    expect(info[LEVEL]).toBe(level)
    expect(info[SPLAT]).toStrictEqual([])
    expect(info.level).toBe(level)
    expect(info.message).toBe('null')
  })
  it('Should format undefined splat', () => {
    const info = allFunc.transform({
      [LEVEL]: level,
      [SPLAT]: [undefined],
      level: level,
      message: undefined
    })
    expect(info[LEVEL]).toBe(level)
    expect(info[SPLAT]).toStrictEqual([undefined])
    expect(info.level).toBe(level)
    expect(info.message).toBe('undefined undefined')
  })
  it('Should format null', () => {
    const info = allFunc.transform({
      [LEVEL]: level,
      [SPLAT]: [null],
      level: level,
      message: null
    })
    expect(info[LEVEL]).toBe(level)
    expect(info[SPLAT]).toStrictEqual([null])
    expect(info.level).toBe(level)
    expect(info.message).toBe('null null')
  })
})

describe('Format Object', () => {
  const rewiredLogger = rewire('../../includes/logger')
  const formanObject = rewiredLogger.__get__('formatObject')
  it('Should format strings', () => {
    const info = formanObject('yeet')
    expect(info).toBe('yeet')
  })
  it('Should format errors', () => {
    const info = formanObject(new Error('yeetErr'))
    expect(info).toBe('yeetErr')
  })
  it('Should format objects', () => {
    const info = formanObject({ value: 'yar' })
    expect(info).toBe('{"value":"yar"}')
  })
  it('Should format object message', () => {
    const info = formanObject({ message: 'yar' })
    expect(info).toBe('yar')
  })
  it('Should format undefined', () => {
    const info = formanObject(undefined)
    expect(info).toBe('undefined')
  })
  it('Should format null', () => {
    const info = formanObject(null)
    expect(info).toBe('null')
  })
})


describe('Transport Formats', () => {
  const levels = ['error', 'warn', 'info', 'debug', 'silly']
  process.env.log_level = 'silly'
  process.env.console_level = 'silly'
  const label = 'test'
  const config = require('../../includes/logger').getConfig(label)
  const transports = ([] as winston.transport[]).concat(config.transports ?? [])
  it('Should format strings', () => {
    for (const transport of transports) {
      expect(transport.format).toBeDefined()
      for (const level of levels) {
        const info = transport.format ? transport.format.transform({
          [LEVEL]: level,
          [SPLAT]: [],
          level: level,
          message: 'yeet'
        }) : undefined
        expect(info).toBeDefined()
        expect(typeof info).not.toBe('boolean')
        if (info !== undefined && typeof info !== 'boolean') {
          expect(info[LEVEL_STRING]).toBe(level)
          expect(info[SPLAT_STRING]).toStrictEqual([])
          expect(info.label).toBe(label)
          expect(info.message).toBe('yeet')
          expect(info[MESSAGE_STRING]).toBeDefined()
        }
      }
    }
  })
})

/*
describe('Transport Formats Mock', () => {
  var rewiredLogger = rewire('../../includes/logger')
  var mockAll: jest.Mock = jest.fn(() => null)
  var mockLogger: {
    format: {
      combine: jest.Mock
      timestamp: jest.Mock
      colorize: jest.Mock
      label: jest.Mock
      errors: jest.Mock
      printf: jest.Mock
      json: jest.Mock
    }
  } = {
    format: {
      combine: jest.fn(() => null),
      timestamp: jest.fn(() => null),
      colorize: jest.fn(() => null),
      label: jest.fn(() => null),
      errors: jest.fn(() => null),
      printf: jest.fn(() => null),
      json: jest.fn(() => null)
    }
  }
  beforeAll(() => {
    rewiredLogger.__set__({
      logger: mockLogger,
      all: mockAll
    })
  })
  beforeEach(() => {
    mockAll.mockClear()
    mockLogger.format.combine.mockClear()
    mockLogger.format.timestamp.mockClear()
    mockLogger.format.colorize.mockClear()
    mockLogger.format.label.mockClear()
    mockLogger.format.errors.mockClear()
    mockLogger.format.printf.mockClear()
    mockLogger.format.json.mockClear()
  })
  it('Should format strings', () => {
    rewiredLogger.__get__('getConfig')('test')
    expect(mockAll).toBeCalledTimes(1)
    expect(mockLogger.format.combine.length).toBeGreaterThan(0)
    expect(mockLogger.format.timestamp.length).toBeGreaterThan(0)
    expect(mockLogger.format.colorize.length).toBeGreaterThan(0)
    expect(mockLogger.format.label.length).toBeGreaterThan(0)
    expect(mockLogger.format.errors.length).toBeGreaterThan(0)
    expect(mockLogger.format.printf.length).toBeGreaterThan(0)
    expect(mockLogger.format.json.length).toBeGreaterThan(0)
  })
})
*/
