let express = require('express')
let app = express()
app.use(express.json())
let path = require('path')
let {open} = require('sqlite')
let sqlite3 = require('sqlite3')
let driver_path = path.join(__dirname, 'covid19India.db')

let db = null

let initializing_db_server = async () => {
  try {
    db = await open({
      filename: driver_path,
      driver: sqlite3.Database,
    })

    app.listen(3000, () => {
      //console.log(db)
      console.log('server runing on port 3000')
    })
  } catch (error) {
    console.log(error.message)
  }
}

initializing_db_server()

let get_particular_state = each => {
  return {
    stateId: each.state_id,
    stateName: each.state_name,
    population: each.population,
  }
}

let get_particular_district = each => {
  return {
    districtId: each.district_id,
    districtName: each.district_name,
    stateId: each.state_id,
    cases: each.cases,
    active: each.active,
    deaths: each.deaths,
  }
}

app.get('/states/', async (request, response) => {
  let query = `
  SELECT 
  *
  FROM 
  state
  `
  let states_detailes = await db.all(query)
  //response.send(states_detailes)
  response.send(
    states_detailes.map(each => {
      return {
        stateId: each.state_id,
        stateName: each.state_name,
        population: each.population,
      }
    }),
  )
})

app.get('/states/:stateId', async (request, response) => {
  let {stateId} = request.params
  let query = `
    SELECT * 
    FROM 
    STATE
    WHERE
    state_id=${stateId}

    `
  let response_detailes = await db.get(query)
  response.send(get_particular_state(response_detailes))
})

app.post('/districts/', async (request, response) => {
  let body_detailes = request.body

  let {districtName, stateId, cases, cured, active, deaths} = body_detailes
  let query = `
  
  INSERT INTO DISTRICT(district_name,state_id,cases,cured,active,deaths)
  values('${districtName}',${stateId},${cases},${cured},${active},${deaths})

  `
  let db_reponse = await db.run(query)
  response.send('District Successfully Added')
})

app.get('/districts/:districtId/', async (request, response) => {
  let {districtId} = request.params
  let query = `
  SELECT *
  FROM 
  DISTRICT
  WHERE 
  district_id=${districtId}
  `
  let db_response = await db.get(query)
  response.send(get_particular_district(db_response))
})

app.delete('/districts/:districtId/', async (request, response) => {
  let {districtId} = request.params
  let query = `
  DELETE FROM
  DISTRICT
  WHERE 
  district_id=${districtId}
  `
  let db_response = await db.run(query)
  response.send('District Removed')
})

app.put('/districts/:districtId/', async (request, response) => {
  let {districtId} = request.params
  let body_detailes = request.body
  let {districtName, stateId, cases, cured, active, deaths} = body_detailes
  let query = `
  UPDATE 
  DISTRICT 
  SET 
  district_name='${districtName}',
  state_id=${stateId},
  cases=${cases},
  cured=${cured},
  active=${active},
  deaths=${deaths}

    WHERE 
    district_id=${districtId}
  `
  let db_response = await db.run(query)
  // response.send(db_response)
  response.send('District Details Updated')
})

app.get('/states/:stateId/stats', async (request, response) => {
  let {stateId} = request.params
  let query = `
  SELECT 
  SUM(cases),
  SUM(CURED),
  SUM(ACTIVE),
  SUM(DEATHS)
  FROM 
  DISTRICT
  WHERE 
  state_id=${stateId}

`
  let stats = await db.get(query)
  console.log(stats)
  response.send({
    totalCases: stats['SUM(cases)'],
    totalCured: stats['SUM(CURED)'],
    totalActive: stats['SUM(ACTIVE)'],
    totalDeaths: stats['SUM(DEATHS)'],
  })
})

app.get('/districts/:districtId/details/', async (request, response) => {
  let {districtId} = request.params
  let query_get_state_id = `
  SELECT 
  state_id
  FROM 
  DISTRICT
  WHERE 
  district_id =${districtId};
  `
  let db_response_state_id = await db.get(query_get_state_id)
  let query_get_state_name = `
  
  SELECT 
  state_name  as stateName
  FROM 
  STATE
  WHERE 
  state_id=${db_response_state_id.state_id}
  `
  let db_response = await db.get(query_get_state_name)
  // console.log(db_response)

  response.send(db_response)
})

module.exports = app
