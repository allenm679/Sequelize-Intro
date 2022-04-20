require('dotenv').config()
const {CONNECTION_STRING} = process.env
const Sequelize = require('sequelize')

// you wouldn't want to rejectUnauthorized in a production app, but it's great for practice
const sequelize = new Sequelize(CONNECTION_STRING, {
    dialect: 'postgres', 
    dialectOptions: {
        ssl: {
            rejectUnauthorized: false
        }
    }
})

// we are mocking a user being signed in
// these ids belong to the same person - "Fern" one of the seeded users
const userId = 4
const clientId = 3

module.exports = {
    getUserInfo: (req, res) => {
        sequelize.query(`select * from cc_clients c
        join cc_users u on c.user_id = u.user_id
        where u.user_id = ${userId};`)
            .then(dbRes => res.status(200).send(dbRes[0]))
            .catch(err => console.log(err))
    }, 

    updateUserInfo: (req, res) => {
        let {
            firstName,
            lastName,
            phoneNumber,
            email,
            address,
            city,
            state,
            zipCode
        } = req.body

        sequelize.query(`update cc_users set first_name = '${firstName}', 
        last_name = '${lastName}', 
        email = '${email}', 
        phone_number = ${phoneNumber}
        where user_id = ${userId};
        
        update cc_clients set address = '${address}', 
        city = '${city}', 
        state = '${state}', 
        zip_code = ${zipCode}
        where user_id = ${userId};`)
            .then(() => res.sendStatus(200))
            .catch(err => console.log(err))

    },

    getUserAppt: (req, res) => {
        sequelize.query(`select * from cc_appointments
        where client_id = ${clientId}
        order by date desc;`)
            .then(dbRes => res.status(200).send(dbRes[0]))
            .catch(err => console.log(err))
    }, 

    requestAppointment: (req, res) => {
        const {date, service} = req.body 

        sequelize.query(`insert into cc_appointments (client_id, date, service_type, notes, approved, completed)
        values (${clientId}, '${date}', '${service}', '', false, false)
        returning *;`)
            .then(dbRes => res.status(200).send(dbRes[0]))
            .catch(err => console.log(err))
    },
    getPendingAppointments: (req,res) => {
        sequelize.query(`select * from cc_appointments
        where approved = false
        order by date desc;
        `)
        .then(dbRes => res.status(200).send(dbRes[0]))
        .catch(err => console.log(err))
    },
    getUpcomingAppointments: (req,res) => {
        sequelize.query(`select a.appt_id, a.date, a.service_type,a.approved, a.completed, u.first_name,u.last_name
        from cc_appointments a
        join cc_emp_appts ea on a.appt_id = ea.appt_id
        join cc_employees e on e.emp_id = ea.emp_id
        join cc_users u on e.user_id = u.user_id
        where a.approved = true and a.completed = false
        order by a.date desc;
        `)
        .then(dbRes => res.status(200).send(dbRes)[0])
        .catch(err => console.log(err))
    },
    getPastAppointments: (req,res) => {
        sequelize.query(`select a.appt_id, a.date, a.service_type,a.approved, a.completed, u.first_name,u.last_name
        from cc_appointments a
        join cc_emp_appts ea on a.appt_id = ea.appt_id
        join cc_employees e on e.emp_id = ea.emp_id
        join cc_users u on e.user_id = u.user_id
        where a.approved = true and a.completed = false
        order by a.date desc;
        `)
        .then(dbRes => res.status(200).send(dbRes[0]))
        .catch(err => console.log(err))
    },
    approveAppointment: (req,res) => {
        let {apptId} = req.body
        
        sequelize.query(`pdate cc_appointments set approved = true
        where appt_id = ${apptId};
        
        insert into cc_emp_appts (emp_id, appt_id)
        values (${nextEmp}, ${apptId}),
        (${nextEmp + 1}, ${apptId});
        `)
            .then(dbRes => {
                res.status(200).semd(dbRes[0])
                nextEmp += 2
            })
            .catch(err => console.log(err))
    },
    completeAppointment: (req,res) => {
        let {apptId} = req.body
        sequelize.query(`update cc_appointments set completed = true
        where appt_id = ${apptId};`)
        .then(dbRes => res.status(200).send(dbRes[0]))
        .catch(err => console.log(err))
    }
}