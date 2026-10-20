import { APP_DESCRIPTION, APP_NAME } from '../constants/app'

export function HomePage() {
  return (
    <section className="home">
      <h1>{APP_NAME}</h1>
      <p>{APP_DESCRIPTION}</p>
      <p className="home-hint">
        Start building in <code>src/pages</code>, <code>src/components</code>, and{' '}
        <code>src/services</code>.
      </p>
    </section>
  )
}
