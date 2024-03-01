import express from "express";
import bodyParser from "body-parser";
import mysql from "mysql2";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";
import env from "dotenv";

const app = express();
const port = 3000;
const saltRounds=10;
env.config();

app.use(express.urlencoded({extended :true}));

app.use(session({
    secret : process.env.SESSION_SECRET,
    resave : false,
    saveUninitialized : true,
    cookie:{
        maxAge: 1000*60*60*24
    }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.static("public"));

const db = mysql.createPool({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_DATABASE
  }).promise();
  


app.get("/", (req,res)=>{

    // let sql = 'SELECT * FROM SALESMAN;'
    // let [result] = await db.query(sql);
    // console.log(result);
    // result.forEach((i)=>{
    //     console.log(i);
    // });
    if(req.isAuthenticated()){
        res.render("home.ejs");
    } else{   
        res.render("login.ejs");
    }

});

app.get("/home", async (req,res)=>{
    if(req.isAuthenticated()){
        // const ReviewedMovies = await showReviewedMovies(req.user);
        //console.log(ReviewedMovies);
        // const WatchlistMovies = await showWatchlistMovies(req.user);
        //console.log(WatchlistMovies);
        const trendingMovies = await showTrendingMovies();
        res.render("home.ejs",{trendingMovies:trendingMovies});
    } else{   

        res.render("login.ejs");
    }
});

app.get("/admin", async (req, res) => {
  if (req.isAuthenticated() && req.user.USER_TYPE === 'ADMIN') {
    const moviesInDatabase = await getMoviesInDatabase();
    console.log(moviesInDatabase);
    res.render("admin.ejs", { moviesInDatabase:moviesInDatabase});
  } else {
      res.redirect("/login");
  }
});

app.get("/login", (req, res)=>{
    res.render("login.ejs");
});

app.get("/register", (req,res)=>{
    res.render("register.ejs");
});

app.get("/adminLogin",(req,res)=>{

  res.render("adminLogin.ejs");
});
app.get("/adminRegister",(req,res)=>{
  res.render("adminRegister.ejs");
});

// app.post("/adminLogin",)

app.post("/login", (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
      if (err) { 
        return next(err); 
      }
      if (!user) { 
        return res.redirect('/login'); 
      }
      req.logIn(user, async (err) => {
          if (err) { 
            return next(err); 
          }
          try {
              const userId = req.user.USER_ID
              const userType = await getUserType(userId); 
              if (userType === 'USER') {
                  return res.redirect('/home');
              } else if (userType === 'ADMIN') {
                  return res.redirect('/admin');
              } else {
                  return res.redirect('/login');
              }
          } catch (err) {
              console.error('Error getting user type:', err);
              return res.redirect('/login');
          }
      });
  })(req, res, next);
});

app.post("/register", async (req,res)=>{

    const username = req.body.username;
    const password = req.body.password;
    const age = req.body.age;
    const country = req.body.country;

    try{
        const [checkResult] = await db.query("SELECT * FROM USER WHERE USERNAME = ? ", [username]) ;
        if (checkResult.length>0){
            res.redirect("/login");
        } else {
            bcrypt.hash(password, saltRounds, async (err, hash) => {
                if (err) {
                  console.error("Error hashing password:", err);
                } else {
                  const [result] = await db.query(
                    "INSERT INTO user (user_type,username, password , age, country  ) VALUES ('USER',?, ?, ?, ?);",
                    [username, hash, age, country]
                  );
                  res.redirect("/login");
                  
                }
              });
        }
       // const hashedpassword = await bcrypt.hash(req.body.password, saltRounds);

    } catch (err){
        console.log(err);

    }
});

app.post("/adminRegister", async (req,res)=>{

  const username = req.body.username;
  const password = req.body.password;
  const age = req.body.age;
  const country = req.body.country;

  try{
      const [checkResult] = await db.query("SELECT * FROM USER WHERE USERNAME = ? ", [username]) ;
      if (checkResult.length>0){
          res.redirect("/login");
      } else {
          bcrypt.hash(password, saltRounds, async (err, hash) => {
              if (err) {
                console.error("Error hashing password:", err);
              } else {
                const [result] = await db.query(
                  "INSERT INTO user (user_type,username, password , age, country  ) VALUES ('ADMIN',?, ?, ?, ?);",
                  [username, hash, age, country]
                );
                res.redirect("/login");
                
              }
            });
      }
     

  } catch (err){
      console.log(err);

  }
});

app.get('/search',  async (req, res) =>{

  const Movie_Name = req.query.Movies;
  const searchedMovies = await getSearchedMovies(Movie_Name);

  res.render("explore.ejs",{searchedMovies:searchedMovies});
});

app.get('/community', async (req, res)=>{

  const reviews = await getCommunityReviews();

  res.render("community.ejs",{reviews:reviews});
});

app.get('/completed', async (req,res)=>{
  const userId = req.user.USER_ID;
  const completedMovies = await getCompletedMovies(userId);
  res.render("completed.ejs", {completedMovies: completedMovies});
});

app.get('/watchlist', async(req,res)=>{
  const userId = req.user.USER_ID;
  const watchlistMovies = await showWatchlistMovies(req.user);
  res.render("watchlist.ejs",{watchlistMovies:watchlistMovies});

});

app.get('reviews', async (req,res)=>{


});

app.get('/movie/:Movies', async (req,res)=>{
  const movieId = req.params.Movies;
  const movieDetails = await getMovieDetails(movieId);
  const actors = await getActors(movieId);
  const directors = await getDirectors(movieId);
  res.render("movie.ejs",{movieDetails:movieDetails,actors:actors, directors:directors});

});

app.get('/watchlist/:Movies', async (req,res)=>{
  const movieId = req.params.Movies;
  const userId = req.user.USER_ID;
  const movieInWatchlist = await checkMovieInWatchlist(movieId,userId);
  if (movieInWatchlist){
    const movieDetails = await getMovieDetails(movieId);
    const actors = await getActors(movieId);
    const directors = await getDirectors(movieId);
    const message1 = "Movie is already in the Watchlist";
    res.render("movie.ejs",{movieDetails:movieDetails,actors:actors, directors:directors, message1:message1});
  } else {
    await addMovieToWatchlist(movieId,userId);
    const movieDetails = await getMovieDetails(movieId);
    const actors = await getActors(movieId);
    const directors = await getDirectors(movieId);
    const message1= "Movie added to the Watchlist";
    res.render("movie.ejs",{movieDetails:movieDetails,actors:actors, directors:directors,message1:message1});
  }
});

app.get('/watched/:Movies', async (req,res)=>{
  const movieId = req.params.Movies;
  const userId = req.user.USER_ID;
  const movieInCompleted = await checkMovieInCompleted(movieId,userId);
  if (movieInCompleted){
    const movieDetails = await getMovieDetails(movieId);
    const actors = await getActors(movieId);
    const directors = await getDirectors(movieId);
    const message2 = "Movie is already in the completed list";
    res.render("movie.ejs",{movieDetails:movieDetails,actors:actors, directors:directors, message2:message2});
  } else {
    await removeMovieFromWatchlist(movieId,userId);
    await addMovieToCompleted(movieId,userId);
    const movieDetails = await getMovieDetails(movieId);
    const actors = await getActors(movieId);
    const directors = await getDirectors(movieId);
    const message2= "Movie added to the Completed List";
    res.render("movie.ejs",{movieDetails:movieDetails,actors:actors, directors:directors,message2:message2});
  }
});

app.get('/submitReview/:Movies', async (req,res)=>{
  const movieId = req.params.Movies;
  const userId = req.user.USER_ID;
  const text = req.query.review;
  console.log(text);
  const score = req.query.score;
  console.log(score);
  await addReview(movieId,userId,score,text);
  const movieDetails = await getMovieDetails(movieId);
  const actors = await getActors(movieId);
  const directors = await getDirectors(movieId);
  const message3= "Review Submitted";
  res.render("movie.ejs",{movieDetails:movieDetails,actors:actors, directors:directors,message3:message3});
});


app.get('/adminMovies', async (req,res) =>{
  res.render("adminMovies.ejs");
});

app.post('/addMovie', async (req,res) =>{
  const title = req.body.title;
  const releaseDate = req.body.releaseDate;
  const synopsis = req.body.synopsis;
  const runtime = req.body.runtime;
  const imdbRating = req.body.imdbRating;
  const movieImgUrl = req.body.movieImgUrl;
  const movieLang = req.body.movieLang;
  await addMovieToDB(title,releaseDate,synopsis,runtime,imdbRating,movieImgUrl,movieLang);
  const message = "Movie Added successfully";
  res.render("adminMovies.ejs",{message:message});
});

app.get('/showArtists', async (req,res) =>{
  const artistsInDB = await getArtistsInDb();
  res.render("showArtists.ejs",{artistsInDB:artistsInDB});

});

app.get('/addArtists', async (req,res) =>{
  res.render("addArtists.ejs");
});

app.post('/addArtists', async (req,res) =>{
  const artistName = req.body.artistName;
  const role = req.body.role;
  const artistGender = req.body.artistGender;
  await addArtistsToDB(artistName,role,artistGender);
  const message = "Artist added to the Database";
  res.render("addArtists.ejs",{message:message});
});

app.get('/adminGenre' ,async (req,res) =>{
  const genresInDB = await getGenresInDB();
  res.render("adminGenre.ejs",{genresInDB:genresInDB});
});

app.post('/addGenres', async (req,res)=>{

  const genreName = req.body.genreName;
  await addGenreToDB(genreName);
  const message = "Genre added to the database"
  const genresInDB = await getGenresInDB();
  res.render("adminGenre.ejs",{genresInDB:genresInDB,message:message});
});

app.get("/adminMovieArtist", async(req,res)=>{

  const movieArtists = await getMovieArtists();
  res.render("adminMovieArtist.ejs",{movieArtists:movieArtists});
});

app.post("/adminMovieArtists", async(req,res)=>{

  const artistId = req.body.artistId;
  const movieId = req.body.movieId;
  const role = req.body.role;
  await addMovieArtist(artistId,movieId,role);
  const message = "Inserted Successfully";
  const movieArtists = await getMovieArtists();
  res.render("adminMovieArtist.ejs",{movieArtists:movieArtists, message:message});

});

app.get("/adminMovieGenre", async(req,res)=>{

  const movieGenres = await getMovieGenres();
  res.render("adminMovieGenre.ejs",{movieGenres:movieGenres});
});

app.post("/adminMovieGenre", async(req,res)=>{

  const genreId = req.body.genreId;
  const movieId = req.body.movieId;
  await addMovieGenre(genreId,movieId);
  const message = "Inserted successfully"
  const movieGenres = await getMovieGenres();
  res.render("adminMovieGenre.ejs",{movieGenres:movieGenres,message:message});
});

app.post('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});



passport.use(new Strategy(async function verify(username,password,cb) {

    try {
        const [result] = await db.query("SELECT * FROM user WHERE username = ? ", [
          username,
        ]);
        if (result.length > 0) {
          const user = result[0];
          console.log(user);
          const storedHashedPassword = user.PASSWORD;
          console.log(storedHashedPassword);
          console.log(password);
          bcrypt.compare(password, storedHashedPassword, (err, valid) => {
            if (err) {
              //Error with password check
              console.error("Error comparing passwords:", err);
              return cb(err);
            } else {
              if (valid) {
                //Passed password check
                return cb(null, user);
              } else {
                //Did not pass password check
                return cb(null, false);
              }
            }
          });
        } else {
          return cb("User not found");
        }
      } catch (err) {
        console.log(err);
      }
}));

passport.serializeUser((user,cb)=>{
    cb(null,user);
});

passport.deserializeUser((user,cb)=>{
    cb(null,user);
});

app.listen(port, (req,res)=>{

    console.log(`Listening on port ${port}`);
});


async function showReviewedMovies(user) {
  console.log(user);

  const result = await db.query("SELECT M.MOVIE_ID, M.TITLE, M.MOVIE_IMAGE_URL FROM MOVIE M, REVIEW R WHERE M.MOVIE_ID=R.MOVIE_ID AND R.USER_ID =?",[user.USER_ID]);
  const rows= result[0];
  return rows;
};

async function showWatchlistMovies(user) {
  
  const result = await db.query("Select M.MOVIE_ID, M.TITLE, M.MOVIE_IMAGE_URL FROM MOVIE M, WATCHLIST W WHERE M.MOVIE_ID=W.MOVIE_ID AND USER_ID =?",[user.USER_ID]);
  const rows = result[0];
  return rows;
};

async function getUserType(userId) {
  try {
      const [result] = await db.query("SELECT USER_TYPE FROM USER WHERE USER_ID =?", [userId]);
      if (result.length > 0) {
          return result[0].USER_TYPE;
      } else {
          throw new Error('User not found');
      }
  } catch (err) {
      throw err;
  }
};


async function showTrendingMovies() {
  const result = await db.query("SELECT MOVIE_ID, TITLE, MOVIE_IMAGE_URL FROM MOVIE ORDER BY MOVIE_ID DESC LIMIT 5");
  
  const rows = result[0];
 
  return rows;
};

async function getSearchedMovies(movie){
  movie = '%' + movie.toUpperCase() + '%';
  console.log(movie);
  const result = await db.query("SELECT MOVIE_ID, TITLE, MOVIE_IMAGE_URL FROM MOVIE WHERE UPPER(TITLE) LIKE ?",[movie]);

  const rows = result[0];

  console.log(rows);
  
  return rows;
};

async function getCommunityReviews(){

  const result = await db.query("SELECT M.TITLE,  M.MOVIE_IMAGE_URL, R.REVIEW_ID, R.TEXT, R.SCORE, R.USER_ID, R.MOVIE_ID, U.USERNAME FROM MOVIE M, REVIEW R, USER U WHERE R.MOVIE_ID=M.MOVIE_ID AND R.USER_ID=U.USER_ID");
  const rows = result[0];
  return rows;
};

async function getMovieDetails(movieId){
  const[result] = await db.query("SELECT MOVIE_ID, TITLE, MOVIE_IMAGE_URL, RELEASE_DATE, SYNOPSIS, RUNTIME, IMDB_RATING, MOVIE_LANG, RATING FROM MOVIE WHERE MOVIE_ID=?",[movieId]);
  // console.log(result);
  const rows= result[0];
  return rows;
};

async function getActors(movieId){

  const result = await db.query("SELECT A.ARTIST_ID, A.ARTIST_NAME FROM ARTIST A, MOVIE_ARTIST MA WHERE A.ARTIST_ID=MA.ARTIST_ID AND MA.MOVIE_ID=? AND MA.MOVIE_ROLE='ACTOR'",[movieId]);
  const rows = result[0];
  return rows;
};

async function getDirectors(movieId){

  const result = await db.query("SELECT A.ARTIST_ID, A.ARTIST_NAME FROM ARTIST A, MOVIE_ARTIST MA WHERE A.ARTIST_ID=MA.ARTIST_ID AND MA.MOVIE_ID=? AND MA.MOVIE_ROLE='DIRECTOR'",[movieId]);
  const rows = result[0];
  return rows;
};

async function checkMovieInWatchlist(movieId,userId){

  const [result] = await db.query("SELECT MOVIE_ID FROM WATCHLIST WHERE MOVIE_ID=? AND USER_ID=? ",[movieId,userId]);
  return result.length > 0 ? true : false;

};

async function addMovieToWatchlist(movieId,userId){
try{
 
  const [result] = await db.query("INSERT INTO WATCHLIST VALUES(?,?) ",[movieId,userId]);
  
  console.log('Inserted Successfully');
} catch(error){
  console.log(error);

}
};

async function checkMovieInCompleted(movieId,userId){
  const [result] = await db.query("SELECT MOVIE_ID FROM COMPLETED WHERE MOVIE_ID=? AND USER_ID=? ",[movieId,userId]);
  return result.length > 0 ? true : false;

};

async function removeMovieFromWatchlist(movieId,userId){
  try{
    const [result] = await db.query("DELETE FROM WATCHLIST WHERE MOVIE_ID=? AND USER_ID=? ",[movieId,userId]);
    console.log('Removed Successfully');
  } catch(error){
    console.log(error);
  
  }
};

async function addMovieToCompleted(movieId,userId){
  try{
    const [result] = await db.query("INSERT INTO COMPLETED(MOVIE_ID,USER_ID,NO_OF_TIMES) VALUES(?,?,1) ",[movieId,userId]);
    console.log('Inserted Successfully');
  } catch(error){
    console.log(error);
  }
};

async function addReview(movieId,userId,score,text){
  try{
    const [result] = await db.query("INSERT INTO REVIEW(MOVIE_ID,USER_ID,SCORE,TEXT) VALUES(?,?,?,?) ",[movieId,userId,score,text]);
    console.log(result);
    console.log('Inserted Successfully');
  } catch(error){
    console.log(error);
  }
};

async function getCompletedMovies(userId){

  const result = await db.query("SELECT M.MOVIE_ID, M.TITLE, M.MOVIE_IMAGE_URL, C.NO_OF_TIMES FROM MOVIE M, COMPLETED C WHERE M.MOVIE_ID=C.MOVIE_ID AND C.USER_ID =?",[userId]);
  const rows= result[0];
  console.log(rows);
  return rows;
};

async function getMoviesInDatabase() {
  try {
    const result = await db.query("SELECT MOVIE_ID, TITLE FROM MOVIE");
    const rows = result[0];
    return rows;
  } catch (error) {
    console.error("Error fetching movies:", error);
    return []; 
  }
};

async function addMovieToDB(title,releaseDate,synopsis,runtime,imdbRating,movieImgUrl,movieLang){
  try{
    const [result] = await db.query("INSERT INTO MOVIE(TITLE,RELEASE_DATE,SYNOPSIS,RUNTIME,IMDB_RATING,MOVIE_IMAGE_URL,MOVIE_LANG) VALUES(?,?,?,?,?,?,?) ",[title,releaseDate,synopsis,runtime,imdbRating,movieImgUrl,movieLang]);
    console.log(result);
    console.log('Inserted Successfully');
  } catch(error){
    console.log(error);
  }
};

async function getArtistsInDb(){
  const result = await db.query("SELECT ARTIST_ID, ARTIST_NAME, GENDER, ROLE FROM ARTIST");
  const rows = result[0];
  console.log(rows);
  return rows;

};

async function addArtistsToDB(artistName,role,artistGender){
  try{
    const [result] = await db.query("INSERT INTO ARTIST(ARTIST_NAME,ROLE,GENDER) VALUES(?,?,?) ",[artistName,role,artistGender]);
    console.log(result);
    console.log('Inserted Successfully');
  } catch(error){
    console.log(error);
  }
};

async function getGenresInDB(){ 
  const result = await db.query("SELECT GENRE_ID, GENRE_NAME FROM GENRE");
  const rows = result[0];
  console.log(rows);
  return rows;
};

async function  addGenreToDB(genreName){
  try{
    const [result] = await db.query("INSERT INTO GENRE(GENRE_NAME) VALUES(?) ",[genreName]);
    console.log(result);
    console.log('Inserted Successfully');
  } catch(error){
    console.log(error);
  }
};

async function  getMovieArtists(){
  const result = await db.query("SELECT A.ARTIST_NAME, M.TITLE, MA.MOVIE_ROLE FROM ARTIST A JOIN MOVIE_ARTIST MA ON A.ARTIST_ID = MA.ARTIST_ID JOIN MOVIE M ON MA.MOVIE_ID = M.MOVIE_ID");
  const rows = result[0];
  console.log(rows);
  return rows;
};

async function addMovieArtist(artistId,movieId,role){
  try{
    const [result] = await db.query("INSERT INTO MOVIE_ARTIST(ARTIST_ID,MOVIE_ID,MOVIE_ROLE) VALUES(?,?,?) ",[artistId,movieId,role]);
    console.log(result);
    console.log('Inserted Successfully');
  } catch(error){
    console.log(error);
  }
};


async function getMovieGenres(){
  const result = await db.query("SELECT M.TITLE, G.GENRE_NAME FROM MOVIE M JOIN MOVIE_GENRE MG ON M.MOVIE_ID = MG.MOVIE_ID JOIN GENRE G ON MG.GENRE_ID = G.GENRE_ID");
  const rows = result[0];
  console.log(rows);
  return rows;

};

async function addMovieGenre(genreId,movieId){
  try{
    const [result] = await db.query("INSERT INTO MOVIE_GENRE(GENRE_ID,MOVIE_ID) VALUES(?,?) ",[genreId,movieId]);
    console.log(result);
    console.log('Inserted Successfully');
  } catch(error){
    console.log(error);
  }
};