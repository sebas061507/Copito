const request = require('supertest');
const app = require('./server');

(async () => {
  try {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@ecommerce.com', password: 'admin1234' });

    console.log('login', login.status, login.body);
    const token = login.body?.data?.token;
    if (!token) {
      console.error('No token');
      process.exit(1);
    }

    const list = await request(app)
      .get('/api/admin/productos')
      .set('Authorization', `Bearer ${token}`);

    console.log('list', list.status, Object.keys(list.body), list.body?.data?.productos?.length);
    const prodId = list.body?.data?.productos?.[0]?.id;
    console.log('prodId', prodId);

    const res = await request(app)
      .get(`/api/admin/productos/${prodId}`)
      .set('Authorization', `Bearer ${token}`);

    console.log('getById', res.status, res.body);
  } catch (err) {
    console.error(err);
  }
})();
