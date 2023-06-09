import dotenv from 'dotenv'
import MissingValueError from '../errors/missingValueError'
const version = require('../../package.json').version

const DEVELOPMENT = 'development'
const TEST = 'test'

export default class ENV {
	constructor() {
		let { parsed, error } = dotenv.config()
		if (!parsed) throw new Error('.env was not parsed')
		if (error) throw error

		this.env = process.env
		this._validate(this.env)
		this.version = version
	}

	_validate(env) {
		Object.keys(env).forEach(key => this[key])
	}

	_value(key, defaultValue = null, cast) {
		return cast(this.env[key] || defaultValue || this._throwMissingError(key))
	}

	_throwMissingError(key) {
		throw new MissingValueError(key)
	}

	get IS_DEVELOPMENT() {
		return this.NODE_ENV === DEVELOPMENT
	}

	get IS_LOCAL() {
		try {
			return this._value('IS_LOCAL', false, Boolean)
		} catch (err) {
			return false
		}
	}

	get IS_TEST() {
		return this.NODE_ENV === TEST
	}

	get MONGO_DB_URL() {
		return `${this._value('MONGO_DB_URL')}${this._value(
			'MONGO_DB_NAME',
			this.IS_TEST ? 'test' : 'library'
		)}`
	}

	get NODE_ENV() {
		return this._value('NODE_ENV', 'development')
	}

	get PORT() {
		return this._value('PORT', '5000')
	}

	get SERVER_ENV() {
		try {
			return this._value('SERVER_ENV')
		} catch (err) {
			console.warn(err)
			return null
		}
	}

	get VERSION() {
		return this.version
	}
}
