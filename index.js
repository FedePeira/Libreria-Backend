const { ApolloServer } = require('@apollo/server')
const { startStandaloneServer } = require('@apollo/server/standalone')
const { v1: uuid } = require('uuid')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')

mongoose.set('strictQuery', false)

const Author = require('./models/author')
const Book = require('./models/book')
const User = require('./models/user')

require('dotenv'). config()

const MONGODB_URI = process.env.MONGODB_URI

console.log('connecting to', MONGODB_URI)

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message)
  })

/*
let authors = [
    {
      name: 'Robert Martin',
      id: "afa51ab0-344d-11e9-a414-719c6709cf3e",
      born: 1952,
    },
    {
      name: 'Martin Fowler',
      id: "afa5b6f0-344d-11e9-a414-719c6709cf3e",
      born: 1963
    },
    {
      name: 'Fyodor Dostoevsky',
      id: "afa5b6f1-344d-11e9-a414-719c6709cf3e",
      born: 1821
    },
    { 
      name: 'Joshua Kerievsky', // birthyear not known
      id: "afa5b6f2-344d-11e9-a414-719c6709cf3e",
    },
    { 
      name: 'Sandi Metz', // birthyear not known
      id: "afa5b6f3-344d-11e9-a414-719c6709cf3e",
    },
]

let books = [
    {
      title: 'Clean Code',
      published: 2008,
      author: 'Robert Martin',
      id: "afa5b6f4-344d-11e9-a414-719c6709cf3e",
      genres: ['refactoring']
    },
    {
      title: 'Agile software development',
      published: 2002,
      author: 'Robert Martin',
      id: "afa5b6f5-344d-11e9-a414-719c6709cf3e",
      genres: ['agile', 'patterns', 'design']
    },
    {
      title: 'Refactoring, edition 2',
      published: 2018,
      author: 'Martin Fowler',
      id: "afa5de00-344d-11e9-a414-719c6709cf3e",
      genres: ['refactoring']
    },
    {
      title: 'Refactoring to patterns',
      published: 2008,
      author: 'Joshua Kerievsky',
      id: "afa5de01-344d-11e9-a414-719c6709cf3e",
      genres: ['refactoring', 'patterns']
    },  
    {
      title: 'Practical Object-Oriented Design, An Agile Primer Using Ruby',
      published: 2012,
      author: 'Sandi Metz',
      id: "afa5de02-344d-11e9-a414-719c6709cf3e",
      genres: ['refactoring', 'design']
    },
    {
      title: 'Crime and punishment',
      published: 1866,
      author: 'Fyodor Dostoevsky',
      id: "afa5de03-344d-11e9-a414-719c6709cf3e",
      genres: ['classic', 'crime']
    },
    {
      title: 'The Demon ',
      published: 1872,
      author: 'Fyodor Dostoevsky',
      id: "afa5de04-344d-11e9-a414-719c6709cf3e",
      genres: ['classic', 'revolution']
    },
]

async function createBookWithAuthor(bookData) {
    const author = await Author.findOne({ name: bookData.author }).exec()
    if(!author){
      console.log('Autor no encontrado: ', author)
      return
    }

    const newBook = new Book({
      title: bookData.title,
      published: bookData.published,
      author: author._id,
      genres: bookData.genres
    })

    
    newBook.save()
      .then(book => {
        console.log("Nuevo libro creado", book)
      })
      .catch(err => {
        console.error("Error al crear un nuevo book: ", err)
      })
}

books.forEach(bookData => {
    createBookWithAuthor(bookData)
})
*/

const typeDefs = `
  type Token {
    value: String!
  }

  type Book {
    title: String!
    published: Int!
    author: ID!
    id: ID!
    genres: [String!]!
  }

  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }

  type Author {
    name: String!
    id: ID!
    born: Int
    bookCount: Int!
  }

  type Query {
    dummy: Int
    bookCount: Int
    authorCount: Int
    allBooks(authorName: String, genre: String): [Book!]!
    allAuthors: [Author!]!
    findAuthorById(authorId: ID!): Author!
    me: User
  }

  type Mutation {
    addBook(
      title: String!
      published: Int!
      author: String!
      genres: [String!]!
    ): Book!
    editAuthor(
        name: String!,
        setBornTo: Int!
    ): Author
    createUser(
      username: String!
      favoriteGenre: String!
    ): User
    login(
      username: String!
      password: String!
    ): Token
  }
`

const resolvers = {
  Query: {
    dummy: () => 0,
    bookCount: async () => Book.collection.countDocuments(),
    authorCount: async () => Author.collection.countDocuments(),
    allBooks: async (root, args) => {
      console.log('---- ALL BOOKS ----')
      console.log('Args :', args)
      console.log('-------------------')

      if(args.authorName && args.genre) {
        console.log('---- Filter by both ----')
        const author = await Author.findOne({ name: args.authorName }).exec()
        if (!author) {
          console.log('Author not found')
          throw new GraphQLError('Author invalidate', {
            extensions: {
              code: 'BAD_BOOKS_INPUT',
              invalidArgs: args.name,
              error
            }
          })        
        }
        const allBooks = await Book.find({ author: author._id, genres: args.genre }).exec()
        //console.log('allBooks:', allBooks)
        console.log('-----------------------')
        return allBooks
      } 

      if(args.genre) {
        console.log('---- Filter by genre ----')
        const allBooks = await Book.find({ genres: args.genre }).exec()
        //console.log('allBooks:', allBooks)
        console.log('-----------------------')        
        return allBooks
      } 

      if(args.authorName) {
        console.log('---- Filter by name ----')
        const author = await Author.findOne({ name: args.authorName }).exec()
        if (!author) {
          console.log('Author not found')
          return []
        }

        const allBooks = await Book.find({ author: author._id }).exec()
        //console.log('allBooks:', allBooks)
        console.log('-----------------------')
        return allBooks
      }

      console.log('---- No Filter ----')
      const allBooks =  await Book.find({}).exec()
      //console.log('allBooks:', allBooks)
      console.log('-----------------------') 
      return allBooks
    },
    allAuthors: async () => {
      console.log('---- ALL AUTHORS ----')
      const authorBooks = {}
      const allBooks = await Book.find({}).exec()
      allBooks.forEach(book => {
        if(!authorBooks[book.author]){
            authorBooks[book.author] = []
        }
        authorBooks[book.author].push(book)
      })

      const allAuthors = await Author.find({}).exec()
      const authorsWithBookCount = allAuthors.map(author => {
        // console.log('Author: ', author)
        const authorBooksCount = authorBooks[author._id] ? authorBooks[author._id].length : 0
        return {
            ...author._doc,
            bookCount: authorBooksCount
        }
      })
      //console.log('AuthorsBooksCount: ', authorsWithBookCount)
      return authorsWithBookCount
    },
    findAuthorById: async(root, args) => {
      console.log('---- FINDING AUTHOR BY ID ----')
      const author = await Author.findOne({ _id: args.authorId }).exec()
      console.log('---- Find Author ----')
      console.log('Args: ', args.authorId)
      console.log('Author: ', author)
      console.log('---------------------')
      return author
    },
    me: (root, args, context) => {
      return context.currentUser
    }
  },
  Mutation: {
    addBook: async (root, args) => {
      console.log('---- ADD BOOK ----')
      console.log('Args: ', args)

      if (!args.title || !args.published || !args.author || !args.genres) {
        console.log('Args --> null')
        throw new GraphQLError('Args invalidate', {
          extensions: {
            code: 'BAD_BOOK_INPUT',
            invalidArgs: args,
            error
          }
        })
      }

      const author = await Author.findOne({ name: args.author }).exec()
      console.log('Author: ', author)

      const book = new Book({...args, author: author._id, id: uuid() })
      console.log('Book: ', book)
      console.log('-------------------')

      try {
        await book.save()
        console.log('---- Book agregado con Exito ----')
      } catch(err) {
        throw new GraphQLError('Saving book failed', {
          extensions: {
            code: 'BAD_BOOK_INPUT',
            invalidArgs: args.author,
            error
          }
        })
      }
      return book
    },
    editAuthor: async (root, args) => {
      console.log('---- EDIT AUTHOR ----')
        if (!args.name || !args.setBornTo ) {
          console.log('Name o setBortTo  estan vacio/s')
          throw new GraphQLError('Args invalidate', {
            extensions: {
              code: 'BAD_AUTHOR_INPUT',
              invalidArgs: args,
              error
            }
          })
        }
        
        const author = await Author.findOne({ name: args.name }).exec()
        if(!author){
          console.log('No se encontro al autor')
          throw new GraphQLError('Author invalidate', {
            extensions: {
              code: 'BAD_AUTHOR_INPUT',
              invalidArgs: args.name,
              error
            }
          })
        }

        author.born = args.setBornTo
        try {
          await author.save()
          console.log('---- Author editado con exito ----')
        } catch(err) {
          throw new GraphQLError('Editing author failed', {
            extensions: {
              code: 'BAD_AUTHOR_INPUT',
              invalidArgs: args.name,
              error
            }
          })
        }
        return author
    },
    createUser: async (root, args) => {
      console.log('---- CREATE USER ----')
      const user = new User({ username: args.username, favoriteGenre: args.favoriteGenre })

      return user.save()
        .catch(error => {
          throw new GraphQLError('Creating the user failed', {
            extensions: {
              code: 'BAD_USER_INPUT',
              invalidArgs: args.username,
              error
            }
          })
        })
    },
    login: async (root, args) => {
      console.log('---- LOGIN USER ----')
      const user = await User.findOne({ username: args.username })
      console.log('User: ', user)
      console.log('--------------------')
      if(!user || args.password !== 'secret') {
        throw new GraphQLError('wrong credentials', {
          extensions: {
            code: 'BAD_USER_INPUT'
          }
        })
      }

      const userForToken = {
        username: user.username,
        id: user._id
      }

      return { value: jwt.sign(userForToken, process.env.JWT_SECRET) }
    }
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

startStandaloneServer(server, {
  listen: { port: 4000 },
  context: async ({ req, res }) => {
    const auth = req ? req.headers.authorization : null
    if(auth && auth.startsWith('Bearer ')) {
      const decodedToken = jwt.verify(
        auth.substring(7), process.env.JWT_SECRET
      )
      const currentUser = await User
        .findById(decodedToken.id)
      return { currentUser }
    }
  }
}).then(({ url }) => {
  console.log(`Server ready at ${url}`)
})