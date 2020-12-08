// Helper functions to manage users, joining, signing out, remove users, get users....

const users = [];

// Id of a socket instance, 
function addUser({id, name, room}) {
  // Room name Johns room would be johnsroom

  name = name.trim();

  // A new user is trying to sign up in the same room with a same user name
  const existingUser = users.find((user) => user.room === room && user.name === name)

  if(existingUser) {
    return {error: 'Username is taken'};
  }

  const user = {id, name, room};
  users.push(user);
  console.log('Returning name as: ' + user.name);
  return {user};
}

function removeUser(id) {
  const index = users.findIndex((user) => user.id === id);

  if(index != -1) {
    return users.splice(index, 1)[0];
  }
}

function getUser(id) {
  return users.find((user) => user.id === id);
}

function getUsersInRoom(room) {
  return users.filter((user) => user.room === room);
}

module.exports = {addUser, removeUser, getUser, getUsersInRoom};