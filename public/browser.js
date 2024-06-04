window.onload = generateTodos;

let skip = 0;
console.log(skip);

function generateTodos(){
    axios.get(`/read-item?skip=${skip}`).then((res) => {  //
        if(res.status !== 200){
            alert(res.data.message);
        }
        const todos = res.data.data; //it returns an array.
        console.log(todos);
        document.getElementById("item_list").insertAdjacentHTML("beforeend", todos.map((x) => {
            return `<li class="list-group-item list-group-item-action d-flex align-items-center justify-content-between">
            <span class="item-text">${x.todo}</span>
            <div>
            <button data-id="${x._id}" class="edit-me btn btn-secondary btn-sm mr-1">Edit</button>
            <button data-id="${x._id}" class="delete-me btn btn-danger btn-sm">Delete</button>
            </div>
            </li>`  //refer incoming data from api  in console
        }).join("")
    );
    skip += todos.length;  //After bringing the data we increment the value of skip to length of todos.
        console.log(skip);
    }).catch((err) => {
        console.log();
    })
}

document.addEventListener("click", function(event){
    //edit todo
    if(event.target.classList.contains("edit-me")){
        const newData = prompt("Enter new Todo text");
        const todoId = event.target.getAttribute("data-id");

        axios.post("/edit-item", {newData, todoId}).then((res) => {
            if(res.data.status !== 200){  // check from from api in console
                alert(res.data.message);
                return;
            }
            event.target.parentElement.parentElement.querySelector(".item-text").innerHTML = newData; //the edit functionality is perform by backend api, these 2 lines are just to updae on UI instantly.
            console.log(res);
        }).catch((err) => {
            console.log(err);
        });
    }
    //delete todo
    else if(event.target.classList.contains("delete-me")){
        const todoId = event.target.getAttribute("data-id");
        axios.post("/delete-item", {todoId}).then((res) => {
            if(res.data.status !== 200){ // check from from api in console
                alert(res.data.message);
                return;
            }
            event.target.parentElement.parentElement.remove(); //The delete functionality is done by backend api,this line is just to instant update on UI without refreshing.
        }).catch((err) => {
            console.log(err);
        });
    }
    //create todo.
    else if(event.target.classList.contains("add-item")){
        const todo = document.getElementById("create_field").value; //1st of all we have to get the todo write by user.
        console.log(todo );
        axios.post("/create-item", {todo}).then((res) => {
           if(res.data.status !== 201){
            alert(res.data.message);
           }
           document.getElementById("create_field").value = "";

           document.getElementById("item_list").insertAdjacentHTML("beforeend", 
           `<li class="list-group-item list-group-item-action d-flex align-items-center justify-content-between">
            <span class="item-text">${res.data.data.todo}</span>
            <div>
            <button data-id="${res.data.data._id}" class="edit-me btn btn-secondary btn-sm mr-1">Edit</button>
            <button data-id="${res.data.data._id}" class="delete-me btn btn-danger btn-sm">Delete</button>
            </div>
            </li>`  //refer incoming data from api  in console
        );
    
        }).catch((err) => {
            console.log(err);
        })
    }
    //show more button
    else if(event.target.classList.contains("show_more")){
        generateTodos()
    }
})