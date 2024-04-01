const { ApolloServer } = require('@apollo/server')
const { startStandaloneServer } = require('@apollo/server/standalone')
const { v1: uuid } = require('uuid')
const mongoose = require('mongoose')

mongoose.set('strictQuery', false)

const Author = require('./models/author')
const Book = require('./models/book')

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
  type Book {
    title: String!
    published: Int!
    author: ID!
    id: ID!
    genres: [String!]!
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
          return []
        }
        const allBooks = await Book.find({ author: author._id, genres: args.genre }).exec()
        console.log('allBooks:', allBooks)
        console.log('-----------------------')
        return allBooks
      } 

      if(args.genre) {
        console.log('---- Filter by genre ----')
        const allBooks = await Book.find({ genres: args.genre }).exec()
        console.log('allBooks:', allBooks)
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
        console.log('allBooks:', allBooks)
        console.log('-----------------------')
        return allBooks
      }

      console.log('---- No Filter ----')
      const allBooks =  await Book.find({}).exec()
      console.log('allBooks:', allBooks)
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
        console.log('Author: ', author)
        const authorBooksCount = authorBooks[author._id] ? authorBooks[author._id].length : 0
        return {
            ...author._doc,
            bookCount: authorBooksCount
        }
      })
      console.log('AuthorsBooksCount: ', authorsWithBookCount)
      return authorsWithBookCount
    }
  },
  Mutation: {
    addBook: async (root, args) => {
      console.log('---- ADD BOOK ----')
      console.log('Args: ', args)

      if (!args.title || !args.published || !args.author || !args.genres) {
        console.log('Entre en null')
        return null
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
        throw new UserInputError(err.message, {
          invalidArgs: args,
        })
      }
      return book
    },
    editAuthor: async (root, args) => {

        if (!args.name || !args.setBornTo ) {
          console.log('Name o setBortTo  estan vacio/s')
          return null
        }
        
        const author = await Author.findOne({ name: args.name }).exec()
        if(!author){
          console.log('No se encontro al autor')
          return null
        }

        author.born = args.setBornTo
        try {
          await author.save()
          console.log('---- Author editado con exito ----')
        } catch(err) {
          throw new UserInputError(error.message, {
            invalidArgs: args,
          })
        }
        return author
    }
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

startStandaloneServer(server, {
  listen: { port: 4000 },
}).then(({ url }) => {
  console.log(`Server ready at ${url}`)
})