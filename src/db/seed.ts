import { eq } from 'drizzle-orm'
import { accountTable, sessionTable, userTable } from './schema'
import { db } from '.'
import { auth } from '../lib/better-auth/auth'

async function main() {
  try {
    await db.delete(userTable)
    await db.delete(accountTable)

    const email = 'admin@sample.com'
    await auth.api.signUpEmail({
      body: {
        email,
        name: 'システム管理者',
        password: 'Password123!',
      },
    })

    await db
      .update(userTable)
      .set({
        role: 'ADMIN',
      })
      .where(eq(userTable.email, email))

    const email2 = 'user@sample.com'
    await auth.api.signUpEmail({
      body: {
        email: email2,
        name: '利用者',
        password: 'Password123!',
      },
    })

    await db
      .update(userTable)
      .set({
        role: 'USER',
      })
      .where(eq(userTable.email, email2))

    await db.delete(sessionTable)
  } finally {
    db.$client.end()
  }
}

main()
