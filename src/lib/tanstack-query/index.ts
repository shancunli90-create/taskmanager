import { QueryClient } from '@tanstack/react-query'
export type { QueryClient } from '@tanstack/react-query'

/**
 * SSRを考慮するとグローバル変数にはしない方が良いらしい。
 * * サーバ側だと同一インスタンスを全ユーザで共有することで、キャッシュも共有されてしまう。
 * * メモリリークが発生した場合に解放されない。
 * @returns
 */
export function getQueryClient() {
  return new QueryClient({
    defaultOptions: {
      mutations: {
        onError(error) {
          if (
            typeof window !== 'undefined' &&
            'status' in error &&
            error.status === 401
          ) {
            console.log('mutation 401エラー')
            window.location.href = '/login'
          }
        },
      },
    },
  })
}

/**
 * QueryClientProviderでQueryClientインスタンスを共有できるのはクライアント側だけになるので
 * SSRを考慮すると良くないらしい。
 */
