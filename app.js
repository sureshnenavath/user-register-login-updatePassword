const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'userData.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

//Regester API
app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const encryptPass = await bcrypt.hash(password, 10)
  let userCheck = await db.get(
    `SELECT * FROM user WHERE username = '${username}'`,
  )

  if (userCheck === undefined) {
    if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
      console.log('Password is too short')
    } else {
      let query = `INSERT INTO
    user (username, name, password, gender, location)
    VALUES
    (
      '${username}',
      '${name}',
      '${encryptPass}',
      '${gender}',
      '${location}'  
    );`
      let result = await db.run(query)
      response.status(200)
      console.log('User created successfully')
      response.send('User created successfully')
    }
  } else {
    response.status(400)
    response.status(400)
    console.log('User already exists')
    response.send('User already exists')
  }
})
//Login API
app.post('/login', async (request, response) => {
  const {username, password} = request.body
  let retrivePassword = `select * from user where username = '${username}'`
  let result = await db.get(retrivePassword)

  if (result === undefined) {
    response.status(400)
    console.log('Invalid user')
    response.send('Invalid user')
  } else {
    let passwordConvert = await bcrypt.compare(password, result.password)
    if (passwordConvert === true) {
      response.status(200)
      console.log('Login success!')
      response.send('Login success!')
    } else {
      response.status(404)
      response.send('Invalid password')
      console.log('Invalid password')
    }
  }
})

//Password change API

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  let query = `select * from user where username = '${username}'`
  let result = await db.get(query)
  let passwordConvert = await bcrypt.compare(oldPassword, result.password)
  console.log(passwordConvert)
  if (passwordConvert) {
    if (newPassword.length >= 5) {
      const newPasswordEncrypt = await bcrypt.hash(newPassword, 10)
      const passwordUpdateQuery = `update user set password = '${newPasswordEncrypt}' where username = '${username}'`
      await db.run(passwordUpdateQuery)
      response.status(200)
      response.send('Password updated')
      console.log('Password updated')
    } else {
      response.status(400)
      response.send('Password is too short')
      console.log('Password is too short')
    }
  } else {
    response.status(400)
    response.send('Invalid current password')
    console.log('Invalid current password')
  }
})

module.exports = app
