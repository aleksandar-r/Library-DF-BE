import UserRepository from '../repository/user.repository'
import BcryptUtil from '../utils/bcrypt.util'
import { text } from '../config/common'

export default class UserService {
	constructor() {
		this.repository = new UserRepository()
		this.bcryptUtil = new BcryptUtil()
	}

	// @desc   Get all users
	// @route  GET /user
	// @access Private Editor
	async getAllUsers() {
		const users = await this.repository.getAllWSelect('-password')
		return users
	}

	// @desc   Get a single user
	// @route  GET /user/single
	// @access Private Editor
	async getUserByID(id) {
		const user = await this.repository.getByIdWSelect(id, '-password')
		return user
	}

	// @desc   Create a new user
	// @route  POST /user
	// @access Private Editor
	async createNewUser(user) {
		const { username, email, password, roles = ['User'] } = user
		const isBodyComplete = [username, email, password].every(Boolean)

		if (!isBodyComplete) {
			throw new Error(text.res.allFieldsReq)
		}

		const duplicateEmail = await this.repository.getByEmail(email)
		if (duplicateEmail) {
			throw new Error(text.res.usernameDuplicate)
		}

		// Hash password
		const hashedPwd = await this.bcryptUtil.hashValue(password)

		const userObject = {
			username,
			password: hashedPwd,
			roles,
			email,
			active: false
		}

		const createUser = await this.repository.create(userObject)

		if (!createUser) {
			throw new Error(text.res.invalidUserData)
		}
	}

	// @desc   Update a user
	// @route  PATCH /user
	// @access Private Editor
	async updateUser(user) {
		const { id, username, roles, active, password } = user

		const isActiveBoolean = typeof active !== 'boolean'
		const isRolesArray = !Array.isArray(roles) || !roles.length
		const missingData = [!id, !username, isRolesArray, isActiveBoolean].some(
			Boolean
		)

		if (missingData) {
			throw new Error(text.res.allFieldsExcPwd)
		}

		const updateUser = await this.repository.findById(id)
		if (!updateUser) {
			throw new Error(text.res.userNotFound)
		}

		const duplicateUser = await this.repository.getByUserName(username)

		// check if there are two users with same username but different ids
		const isDuplicateUserId = [
			duplicateUser,
			duplicateUser?._id?.toString() !== id
		].every(Boolean)

		if (isDuplicateUserId) {
			throw new Error(text.res.usernameDuplicate)
		}

		if (password) {
			updateUser.password = await this.bcryptUtil.hashValue(password)
		}

		await this.repository.update(id, user)
		return text.res.userUpdatedFn(username)
	}

	// @desc   Delete a user
	// @route  DELETE /user
	// @access Private Admin
	async deleteUser(id) {
		if (!id) {
			throw new Error(text.res.userIDReq)
		}

		const userExists = await this.repository.findById(id)

		if (!userExists) {
			throw new Error(text.res.userNotFound)
		}

		const result = await this.repository.remove(id)

		return text.res.userDeletedFn(result.username, id)
	}
}
