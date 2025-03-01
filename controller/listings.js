if(process.env.NODE_ENV != "production"){
    require('dotenv').config();
}

const Listing = require("../models/listing.js");
const {geocodeLocation} = require('../public/js/map_api.js');
const map_api_key = process.env.MAP_API_KEY

module.exports.index = async(req, res) =>{
    const allListings =  await Listing.find({});
    res.render("listings/index.ejs", {allListings});
 };
 
module.exports.renderNewForm = (req, res) =>{
    res.render("listings/new.ejs");
};

module.exports.showListing = async(req,res) =>{
    let {id} = req.params;
    const listing = await Listing.findById(id)
    .populate({
       path: "reviews",
       populate:{
           path: "author",
       },
   })
    .populate("owner");
    if(!listing) {
       req.flash("error", "Listing you requested for does not exist!");
       res.redirect("/listings");
    }
    const location = listing.location;
    const country = listing.country;
    const{ lat, lng} = await geocodeLocation(location, country, map_api_key);
    res.render("listings/show.ejs", {listing , lat,lng,map_api_key});
   };

   module.exports.createListing = async (req, res,) =>{
       let url = req.file.path;
       let filename = req.file.filename;
       //console.log(url, "..", filename);
       const newListing =new Listing(req.body.listing);
       newListing.owner = req.user._id;
       newListing.image = {url, filename};
       await newListing.save();
       req.flash("success", "New Listing Created!");
       res.redirect("/listings");
   };

   module.exports.renderEditForm = async (req, res)=>{
       let {id} = req.params;
       const listing = await Listing.findById(id);
       if(!listing) {
           req.flash("error", "Listing you requested for does not exist!");
           res.redirect("/listings");
        }

        let originalImageUrl = listing.image.url;
        originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
       res.render("listings/edit.ejs", { listing , originalImageUrl });
   };

   module.exports.updateListing = async (req,res) =>{
       let {id} = req.params;
      let listing = await Listing.findByIdAndUpdate(id,{...req.body.listing});

      if(typeof req.file !== "undefined") {
      let url = req.file.path;
      let filename = req.file.filename;
      listing.image = {url, filename};
      await listing.save();
      }
      req.flash("success","Listing Updated!");
      res.redirect(`/listings/${id}`);
   };

   module.exports.destroyListing = async(req, res) =>{
       let {id} = req.params;
      let deletedListing =  await Listing.findByIdAndDelete(id);
      console.log(deletedListing);
      req.flash("success","Listing Deleted!");
      res.redirect("/listings");
   };