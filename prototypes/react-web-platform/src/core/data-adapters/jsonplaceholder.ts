import { JsonPlaceholderUser } from '../../types/api'

type User = JsonPlaceholderUser

export class JSONPlaceholderAdapter {
  private baseUrl = 'https://jsonplaceholder.typicode.com'

  async getUsers(): Promise<User[]> {
    try {
      const response = await fetch(`${this.baseUrl}/users`)
      const users = await response.json()
      
      return users.map((user: any) => ({
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        address: {
          street: user.address.street,
          suite: user.address.suite,
          city: user.address.city,
          zipcode: user.address.zipcode,
          geo: {
            lat: user.address.geo.lat,
            lng: user.address.geo.lng
          }
        },
        phone: user.phone,
        website: user.website,
        company: {
          name: user.company.name,
          catchPhrase: user.company.catchPhrase,
          bs: user.company.bs
        }
      }))
    } catch (error) {
      console.error('Error fetching users:', error)
      throw new Error('Failed to fetch users')
    }
  }

  async getLargeUserDataset(multiplier: number = 100): Promise<User[]> {
    const baseUsers = await this.getUsers()
    const largeDataset: User[] = []
    
    for (let i = 0; i < multiplier; i++) {
      baseUsers.forEach((user, index) => {
        largeDataset.push({
          ...user,
          id: i * baseUsers.length + user.id,
          name: `${user.name} ${i + 1}`,
          username: `${user.username}${i + 1}`,
          email: `${user.username}${i + 1}@example.com`
        })
      })
    }
    
    return largeDataset
  }
}