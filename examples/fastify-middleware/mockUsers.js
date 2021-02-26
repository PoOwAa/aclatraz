class MockUser {
  constructor() {
    this.userList = [
      {
        id: 1,
        username: 'john',
        name: 'John Doe',
        animal: 'dog',
        permission: '',
      },
      {
        id: 2,
        username: 'jane',
        name: 'Jane Doe',
        animal: 'cat',
        permission: '',
      },
      {
        id: 3,
        username: 'superadmin',
        name: 'SuperAdmin',
        animal: 'shark',
        permission: '0FFFFFFF-0FFFFFFF',
      },
    ];
  }

  findById(id) {
    return this.userList.find((u) => u.id === id);
  }

  findByUsername(username) {
    return this.userList.find((u) => u.username === username);
  }

  getUserList() {
    return this.userList;
  }

  setPermission(id, permissionString) {
    const user = this.findById(id);
    user.permission = permissionString;
  }
}

export default new MockUser();
