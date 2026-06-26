const router=
require('express')
.Router();

const auth=
require(
'../middleware/authMiddleware'
);

const {
authorize,
}=
require(
'../middleware/roleMiddleware'
);

const c=
require(
'../controllers/payrollController'
);

router.use(
auth
);

router.get(
'/me',
c.getMyPayroll
);

router.post(
'/preview',

authorize(
'admin',
'superuser',
'hr'
),

c.preview
);

router.post(
'/finalize',

authorize(
'admin',
'superuser',
'hr'
),

c.finalize
);

router.get(
'/all',

authorize(
'admin',
'superuser',
'hr'
),

c.getAll
);

router.get(
'/:id',

authorize(
'admin',
'superuser',
'hr',
'employee'
),

c.getOne
);

module.exports= router;