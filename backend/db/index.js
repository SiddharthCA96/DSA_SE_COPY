import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

export const MONGO_URI = process.env.MONGO_URI;


//connnect to mongodb

mongoose
  .connect(
    MONGO_URI
  )
  .then(() => console.log("DB connected"))
  .catch((err) => console.error("DB connection error:", err));


//define the schema

//user schema
const UserSchema=new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true,
        minLength:3,
        maxLength:30
    },
    password:{
        type:String,
        required:true,
        minLength:3
    },
    firstName:{
        type:String,
        required:true,
        trim:true,
        maxLength:30,
    },
    lastName:{
        type:String,
        required:true,
        trim:true,
        maxLength:30,
    },
});

//keyword schema
const all_keywordsSchema=new mongoose.Schema({
    keyword_values:{
        type:String,
        required:true
    }
})

//idf schema
const idfSchema=new mongoose.Schema({
    idf_values:{
        type:String,
    }
})

//tf-idf schema
const tf_idfSchema=new mongoose.Schema({
    tf_idf_values:{
        type:String,
    }
})
//magnitude schema
const magnitudeSchema=new mongoose.Schema({
    mag_values:{
        type:String,
    }
})
//problem schema
const problemSchema=mongoose.Schema({
    problem_desc:{
        type:String,
    },
    problem_url:{
        type:String,
        required:true
    },
    problem_title:{
        type:String,
        required:true
    },
    problem_id:{
        type:Number,
        required:true
    },
    problem_mag:{
        type:Number,
        required:true
    }
})
//create the  models

//user model
export const User=mongoose.model('User',UserSchema);
//keyword model
export const Db_Keyword=mongoose.model('Db_Keyword',all_keywordsSchema);
export const idf=mongoose.model('idf',idfSchema);
export const tf_idf=mongoose.model('tf_idf',tf_idfSchema);
export const Db_mag=mongoose.model('Db_mag',magnitudeSchema);
export const all_problem=mongoose.model('all_problem',problemSchema);
