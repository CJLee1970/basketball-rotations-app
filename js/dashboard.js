// Load my rotations
const myRotationsList = document.getElementById('my-rotations-list');

function renderRotations(snapshot){
  myRotationsList.innerHTML = '';
  if (snapshot.empty){
    myRotationsList.innerHTML = '<li>No saved rotations found.</li>'; 
    return;
  }
  snapshot.forEach(doc => {
    const rot = { id: doc.id, ...doc.data() };
    const li = document.createElement('li');
    li.innerHTML = `<span>${rot.name}</span>
      <div style="display:inline-flex; gap:8px; margin-left:10px;">
        <a class="nav-btn" href="rotation.html#${rot.id}">📂 Load</a>
        <button class="nav-btn" data-id="${rot.id}" data-act="delete">🗑️ Delete</button>
      </div>`;
    myRotationsList.appendChild(li);
  });
}

requireAuth((user)=>{
  const col = db.collection('users').doc(user.uid).collection('rotations').orderBy('createdAt', 'desc');
  col.onSnapshot(renderRotations);

  myRotationsList.addEventListener('click', async (e)=>{
    const btn = e.target.closest('button[data-act="delete"]');
    if(!btn) return;
    const id = btn.dataset.id;
    if(confirm('Delete this rotation?')){
      await db.collection('users').doc(user.uid).collection('rotations').doc(id).delete();
    }
  });
});
