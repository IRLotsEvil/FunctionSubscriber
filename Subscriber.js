// This is a very crude way of adding subscribers to JavaScript///
// You can add and remove functions by using the math operators ( += -= ) on properties
// user can then invoke all the functions within a subscriber property 
// the relay is an object but the subscriber itself is an array of functions (so you can order them)//


// Issues: 
// Whenever a function is evaluated it will attach it's self to the subscriberRelay and won't be deleted until set to the subscriber//

// A global variable that caches the functions before they're passed on.
const subscriberRelay = {};

//// We store the toString function somewhere else before overriding it's behaviour
Function.prototype._toString = Function.prototype.toString;


//// We then override the toString method so that if it is asked to display its body it will instead return a numerical id while attaching a copy of this function the relay 
// By using a copy we retain it's scope, i've used evaluation options before but wasn't happy with it//
Function.prototype.toString = function()
{
    if(!this.id)this.id = (function(str=""){ // generate a 16 digit number, with each digit randomised, as ID//
        for(i=0;i<4;i++)for(a=0; a<4;a++)str += Math.round(Math.random()*9);
        return Number(str);
    })();
    subscriberRelay[this.id] = this; // attach the function to the Relay
    return this.id; // then return the id;
}


// The function createSubscriber allows a user to create a subscriber, the subscriber itself is a property so we need to define a new property on the object//

Object.prototype.createSubscriber = function(propertyNameorMap)
{
    // the user can give a string name or a property map//

    // if a string is given then it's assumed to be a single property being constructed
    // the succeeding arguments must be functions to add to the subscriber upon creation //

    // example 
    //        myObject.createSubscriber("Tasks", function(a){return a;}, function(b){return b;});

    // if an object is given : it's assumed to be a property map//
    // if so then each field must contain either a function or an array of functions or an empty array or null//

    // example 
    //        myObject.createSubscriber({
    //            "Tasks":[ function(a){return a;}, function(b){return b;} ],
    //            "TasksForLater":[]
    //        });

    /// Convert the arguments into map if one wasn't already defined// 
    var map = 
        typeof(propertyNameorMap) == "string" ? 
            (function(){
                var obj={};
                obj[propertyNameorMap] = Array.prototype.slice.call(arguments,1);
                return obj; 
            }).apply(this,arguments):
        typeof(propertyNameorMap) == "object" && !Array.isArray(propertyNameorMap)? 
            propertyNameorMap: {};

    // One object can have many subscribers, this is an object that will contain all the references to those subscribers//
    if(!Reflect.has(this,"_subscriber"))Object.defineProperty(this,"_subscriber",{value:{},enumerable:false,configurable:false,writable:false});

    // This function is used to invoke all the given functions in the subscriber//
    // A reduce function is used so that returned values can be passed on in sequence in case the user wants to transform the arguments into something else along the chain//
    // if an array is returned from a function then it is passed on as arguments to the next function//
    // if a single item is returned then it is passed as a single argument//
    // if undefinded (so no return) it will use the arguments supplied from before//

    if(!Reflect.has(this,"Invoke"))this["Invoke"] = function(name){
        return Reflect.has(this,name)?function(args){
            var that = this;
            return this.reduce(function(a,c){
                var value = Array.isArray(a) ? c.apply(that,a) : c.call(that,a); 
                return(value === undefined)? a : value; 
            },args);
        }.call(this[name],Array.prototype.slice.call(arguments,1)): // Get an Array of the arguments//
        null; 
        
    }.bind(this["_subscriber"]);

    // Iterate through the map 
    Object.getOwnPropertyNames(map).forEach(function(name){

        // If the property in the map isn't an array, turn it into one then filter out anything that isn't a function //
        var prefunctions = (Array.isArray(map[name])?map[name]:[map[name]]).filter(function(x){return typeof(x) === "function"});

        // Overwrite the functions in the Subscriber if it's already defined
        if(Reflect.has(this["_subscriber"],name))this["_subscriber"][name] = prefunctions; 
        else{
            // Define the property //
            // Put the functions into property//
            Object.defineProperty(this["_subscriber"],name,{value:prefunctions,enumerable:false,configurable:true});

            // So, null when evaluated against another number or string returns 0 
            //so our getter for the subscriber property will always return null//

            // When the += operator is used//
            // The numerical id of the function is passed through the setter 
            // it's then checked against the subscriberRelay to see if it exists and also whether it's a function//
            // then it's checked to see if the id in question already exists and, if it passes all checks, 
            // is then added onto the array
            // the function is then deleted from the relay

            // When the -= operator is used//
            // The numerical id is shown as negative when sent through the setter
            // The id is evaluated against all the id's in the array and, if found, proceeds to remove the function//  

            Object.defineProperty(this,name,{
                get:function(){return null;},
                set:function(v){
                    if( v > 0 ){
                        if(Reflect.has(subscriberRelay,v) && typeof(subscriberRelay[v]) === "function" &&
                            this.findIndex(function(x){return x === subscriberRelay[v];}) < 0){
                                this.push(subscriberRelay[v]);
                                Reflect.deleteProperty(subscriberRelay,v);
                            }
                    }
                    if( v < 0 ){
                        var item = this.findIndex(function(x){return x.toString() === (v.toString()*-1);});
                        if(item > -1)Reflect.deleteProperty(this,item);
                        if(Reflect.has(subscriberRelay,v))Reflect.deleteProperty(subscriberRelay,v);
                    }
                }.bind(this["_subscriber"][name]),enumerable:true,configurable:true
            });
        }
    },this);
}
