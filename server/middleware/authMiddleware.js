const {
verifyToken
}=
require(
'../utils/token'
);

const User=
require(
'../models/User'
);

const Employee=
require(
'../models/Employee'
);

module.exports=
async(
req,
res,
next
)=>{

try{

const auth=
req.headers.authorization;

if(
!auth?.startsWith(
'Bearer '
)
){
return res
.status(401)
.json({
success:false
});
}

const token=
auth.split(
' '
)[1];

const decoded=
verifyToken(
token
);

const user=
await User
.findById(
decoded.id
)
.select(
'-password'
);

if(
!user
||
!user.isActive
||
user.status!==
'APPROVED'
){
return res
.status(403)
.json({
success:false,
message:
'Account unavailable',
});
}

const employee=
await Employee
.findOne({
user:
user._id,
})
.select(
'_id'
);

req.user={
...user.toObject(),

employeeId:
employee?._id,

};

next();

}
catch{

return res
.status(401)
.json({
success:false,
message:
'Invalid token',
});

}

};
