import {Pool, createPool} from 'mysql2';
import { db_name, db_password, db_port, db_username } from './config.js';

export const pool = createPool({
     host: 'localhost',
    'port': db_port,
    'user': db_username,
    'password': db_password,
    'database': db_name
});