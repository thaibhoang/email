let counter = 0;
window.onpopstate = function(event) {
  const section = event.state.section;
  const id = event.state.id;
  const email = event.state.email;
  if (section === 'compose') {compose_email();}
  else if (['inbox', 'sent', 'archive'].includes(section)){load_mailbox(section);}
  else if (id === undefined) {
    reply(email);
  }
  else {
    load_email(id);
  }
}

window.onscroll = () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight && document.querySelector('#emails-view').style.display === 'block') {
    counter += 9;
    const mailbox = document.querySelector('h3').textContent.toLowerCase();
    console.log(mailbox);
    load_mailbox(mailbox);
  }
};

document.addEventListener('DOMContentLoaded', function() {
  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => {
    history.pushState({section: 'inbox'}, "", `inbox`);
    counter = 0;
    load_mailbox('inbox');});
  document.querySelector('#sent').addEventListener('click', () => {
    history.pushState({section: 'sent'}, "", `sent`);
    counter = 0;
    load_mailbox('sent');  
  });
  document.querySelector('#archived').addEventListener('click', () => {
    history.pushState({section: 'archived'}, "", `archived`);
    counter = 0;
    load_mailbox('archive')});
  document.querySelector('#compose').addEventListener('click', (event) => {
    history.pushState({section: 'compose'}, "", `compose`);
    compose_email()});

  // By default, load the inbox
  counter = 0;
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block'; 
  document.querySelector('#email').style.display = 'none'; 

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

}





document.querySelector('#sendEmailButton').addEventListener('click', (event) => {
  event.preventDefault();
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value,
    })
  })
  history.pushState({section: 'sent'}, '', 'sent');
  counter = 0;
  load_mailbox('sent');
});


const quantity = 9;
function load_mailbox(mailbox) {
  const start = counter;
  const end = start + quantity;


  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email').style.display = 'none'; 
  if (document.querySelector('h3').textContent.toLowerCase() !== mailbox ) {document.querySelector('#emails-view').innerHTML = '';}
  
  // Show the mailbox name
  if (document.querySelector('#emails-view').textContent === '') {document.querySelector('#emails-view').innerHTML += `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;}
  const emailsView = document.querySelector('#emails-view');
  fetch(`/emails/${mailbox}?start=${start}&end=${end}`)
  .then(response => response.json())
  .then(emails => {
      console.log(start, end, emails);
      for (let email of emails) {
        console.log(email.id);
        const bigBox = document.createElement('div');
        bigBox.classList.add('bigBox');
        const emailContainer = document.createElement('div');
        emailContainer.className = 'emailContainer';
        if (email.read) {
          emailContainer.style.background = 'linear-gradient(45deg, skyblue, white)';
        };
        emailContainer.setAttribute('data-id',`${email.id}`)
        const sender = document.createElement('div');
        const subject = document.createElement('div');
        const timestamp = document.createElement('div');
        sender.textContent = email.sender;
        subject.textContent = email.subject;
        timestamp.textContent = email.timestamp;
        emailContainer.appendChild(sender);
        emailContainer.appendChild(subject);
        emailContainer.appendChild(timestamp);
        if (mailbox === 'inbox') {
          const archive = document.createElement('button');
          archive.textContent = 'Archive';
          bigBox.appendChild(archive);
          archive.addEventListener('click', () => {
            fetch(`/emails/${email.id}`, {
              method: 'PUT',
              body: JSON.stringify({
                archived: true
              })
            });
            counter = 0;
            document.querySelector('h3').textContent = '';
            load_mailbox('inbox');
          });
        }
        bigBox.appendChild(emailContainer);
        emailsView.appendChild(bigBox);
        emailContainer.addEventListener('click', () => {
          const id = emailContainer.dataset.id;
          history.pushState({id: `${id}`}, '', `${id}`)
          document.querySelector('h3').textContent = '';
          load_email(id);     
            
        });
      }
  });

}

function load_email(id) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email').style.display = 'block';
  const emailBox =  document.querySelector('#email');
  emailBox.textContent = '';

  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    const emailContainer = document.createElement('div');
    if (email.read === false) {
      emailContainer.style.backgroundColor = 'white';
    };
    emailContainer.setAttribute('data-id',`${email.id}`)
    const sender = document.createElement('div');
    const subject = document.createElement('div');
    const timestamp = document.createElement('div');
    const body = document.createElement('div');
    const recipients = document.createElement('div');
    const replyButton = document.createElement('button');
    const hr = document.createElement('hr');
    sender.textContent = `From: ${email.sender}`;
    subject.textContent = `Subject: ${email.subject}`;
    recipients.textContent = `To: ${email.recipients.join(', ')}`;
    timestamp.textContent = `Timestamp: ${email.timestamp}`;
    replyButton.setAttribute('type', 'button');
    replyButton.textContent = 'Reply';
    body.textContent = email.body;
    emailContainer.appendChild(sender);
    emailContainer.appendChild(recipients); 
    emailContainer.appendChild(subject);        
    emailContainer.appendChild(timestamp);
    if (email.archived) {
      const unarchived = document.createElement('button');
      unarchived.setAttribute('type', 'button');
      unarchived.textContent = 'Unarchived this email';
      emailContainer.appendChild(unarchived);
      unarchived.addEventListener('click', () => {
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            archived: false
          })
        });
        history.pushState({section: 'inbox'}, '', 'inbox');
        counter = 0;
        load_mailbox('inbox');
      });
    }
    replyButton.addEventListener('click', () => {
      history.pushState({email: email}, '', 'reply');
      reply(email);
    });
    emailContainer.appendChild(replyButton);
    emailContainer.appendChild(hr);
    emailContainer.appendChild(body);
    emailBox.appendChild(emailContainer);
  });
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })

}

function reply(email) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block'; 
  document.querySelector('#email').style.display = 'none'; 

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = email.sender;
  document.querySelector('#compose-subject').value = email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`;
  document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: "${email.body}". `;
}