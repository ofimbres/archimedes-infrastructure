const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-west-2' });

const congitoClient = new AWS.CognitoIdentityServiceProvider({
    apiVersion: "2016-04-19",
    region: "us-west-2"
});

const userPoolId = 'us-west-2_bhkfO4vvk';
const studentGroupName = 'students';
const teacherGroupName = 'teachers';
const adminGroupName = 'admins';
  
// Student #1
var poolData = {
    UserPoolId: userPoolId,
    Username: "ofimbres",
    DesiredDeliveryMediums: ["EMAIL"],
    TemporaryPassword: "P@ssw0rd!",
    UserAttributes: [
    {
        Name: "email",
        Value: "ofimbres-test@gmail.com"
    },
    {
        Name: "email_verified",
        Value: "true"
    },
    {
        Name: "family_name",
        Value: "Fimbres"
    },
    {
        Name: "given_name",
        Value: "Oscar"
    }
    ]
};

congitoClient.adminCreateUser(poolData, (error, data) => {
    console.log(error);
    console.log(data);
});

var params = {
    GroupName: studentGroupName,
    UserPoolId: userPoolId,
    Username: poolData.Username
  }

congitoClient.adminAddUserToGroup(params, function(err, data) {

if (err) console.log("Error");
else     console.log("Success");
});

// Teacher #1
var poolData2 = {
    UserPoolId: userPoolId,
    Username: "gtrevino",
    DesiredDeliveryMediums: ["EMAIL"],
    TemporaryPassword: "P@ssw0rd!",
    UserAttributes: [
    {
        Name: "email",
        Value: "gtrevino-test@gmail.com"
    },
    {
        Name: "email_verified",
        Value: "true"
    },
    {
        Name: "family_name",
        Value: "Trevino"
    },
    {
        Name: "given_name",
        Value: "Guadalupe"
    }
    ]
};

congitoClient.adminCreateUser(poolData2, (error, data) => {
    console.log(error);
    console.log(data);
});

var params2 = {
    GroupName: teacherGroupName,
    UserPoolId: userPoolId,
    Username: poolData2.Username
  }

congitoClient.adminAddUserToGroup(params2, function(err, data) {

if (err) console.log("Error");
else     console.log("Success");
});