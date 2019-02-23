# FunctionSubscriber
A rudimentary JavaScript function subscriber that allows you to use Math operators in properties to add and remove functions

Simple Use:

    Setting the Subscriber "Tasks" 

            myObject.createSubscriber("Tasks");

    Create a new function

            function someFunction(a){
                alert("the answer is : " + a);
            };

    Subscribe the new function

           myObject.Tasks += someFunction;

    Invoke the Subscriber 

            myObject.Invoke("Tasks");

    Remove the function from the Subscriber

            myObject.Tasks -= someFunction;
            
Assign a Subscriber with Pre-subscribed functions:
    
    myObject.createSubscriber("Tasks" , function(a){return a - 500;}, function(b){return b - 400});
    myObject.Invoke("Tasks", 1000); // returns 100;
    
    myObject.Tasks += function(c){ alert(c) };
    myObject.Invoke("Tasks", 1000); // alerts 100; returns 100;
    
Assign a Multiple Subscribers at once;

    myObject.createSubscriber({
      "Tasks":null,
      "TasksforAfter":function(a){ alert(a) },
      "TasksforWhenever": [function(a,b,c){ return a + "" + b + "" +c;},function(a){alert(a)}]
    });
 
  

    
