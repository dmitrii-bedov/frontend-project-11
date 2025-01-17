// @ts-nocheck
// @ts-ignore
import Example from './Example.js';
import onChange from 'on-change';
import * as yup from 'yup';
import i18n from 'i18next'
import resources from './resources/index.js';
import axios from 'axios';
import { Modal } from 'bootstrap';
import _ from 'lodash';

const validate = (value, urls) => {
  const schema = yup.string().url().required().notOneOf(urls);
  return schema.validate(value)
}

const getRssFeed = (url) => {
  return axios.get(`https://allorigins.hexlet.app/get?url=${encodeURIComponent(url)}`)
    .then((response) => {
      // console.log("response.data.contents", response.data.contents)
      return response.data.contents;
    })
    .catch((error) => {
      // console.log(error);
      throw error;
    })
    .finally(() => {
      setTimeout(() => getRssFeed(url), 5000);
    });
}

const parseRssLink = (xmlString) => {
  const xmlDocument = new DOMParser().parseFromString(xmlString, "text/xml");
  const xmlItems = xmlDocument.querySelectorAll("item");
  // console.log("xmlDocument", xmlDocument);

  const items = [];

  for (const item of xmlItems) {
    const title = item.querySelector("title").textContent;
    // console.log("title", title);
    const link = item.querySelector("link").textContent;
    // console.log("link", link);
    const description = item.querySelector("description").textContent;
    // console.log("description", description);
    items.push({ title, link, description })
  };

  const title = xmlDocument.querySelector("title").textContent;
  // console.log("feedTitel", feedTitle);
  const description = xmlDocument.querySelector("description").textContent;
  // console.log("feedDescription", feedDescription);


  return {
    title, description,
    items,
  }
}

export default () => {
  const elements = {
    rssForm: document.querySelector('.rss-form'),
    errorMessage: document.querySelector('.feedback'),
    searchbarPlaceholder: document.getElementById('input'),
    linkExample: document.getElementById('example').innerText,
    posts: document.querySelector('.posts'),
    feeds: document.querySelector('.feeds'),
    modal: document.querySelector('.modal'),
  }

  const intitalState = {
    language: 'ru',
    form: {
      url: '',
      state: 'filling',
      error: '',
    },
    urls: [],
    posts: [],
    feeds: [],
/* remove modal state, make sure the button ID is created to each post and assigned 
to the preview button.
*/
  };

  i18n
    .init({
      lng: intitalState.language,
      fallbackLng: 'en',
      debug: false,
      resources
    }).then(() => {
      yup.setLocale({
        string: {
          url: i18n.t('errors.invalidUrl')
        },
      })
    })

  // Model
  // @ts-ignore
  const state = onChange(intitalState, (path, value, previousValue) => {
    // console.log('stateChange', path, value, JSON.stringify(state));
    if (path === 'form.state') {
      renderError(state);
    }
    if (path === 'feeds') {
      renderFeeds(state);
      // console.log("StateFEEDS", JSON.stringify(state.feeds));
    }
    if (path === 'posts') {
      renderPosts(state);
      // console.log("StatePOSTS", JSON.stringify(state.posts));
    }
  })

  // View
  const renderError = (state) => {
    elements.errorMessage.innerText = i18n.t(state.form.error);
    elements.searchBar?.classList.add('border-danger');
  };

  const renderPosts = (state) => {
    const postsContainer = document.createElement('div');
    postsContainer.className = 'card border-0';
    const postsContainerBody = document.createElement('div');
    postsContainerBody.className = 'card-body';
    const postsHeader = document.createElement('h2');
    postsHeader.className = 'card-title h4';
    postsHeader.innerText = i18n.t('postsHeader');
    postsContainerBody.appendChild(postsHeader);
    elements.posts.innerHTML = '';
    elements.posts.appendChild(postsContainerBody);

    const listGroup = document.createElement('ul');
    listGroup.className = 'list-group border-0 rounded-0';

    const listItemData = state.posts;

    listItemData.forEach((itemData, index) => {
      console.log("itemData", itemData);
      const listItem = document.createElement('li');
      listItem.className = 'list-group-item d-flex justify-content-between align-items-start border-0 border-end-0';
      
      const listItemLink = document.createElement('a');
      listItemLink.href = itemData.link;
      listItemLink.className = 'fw-bold postTitle';
      listItemLink.textContent = itemData.title;
      listItemLink.target = '_blank';
      listItemLink.rel = 'noopener noreferrer';
      listItemLink.setAttribute('data-id', itemData.id);

      const listItemButton = document.createElement('button');
      listItemButton.type = 'button';
      listItemButton.className = 'btn btn-outline-primary btn-sm';
      // listItemButton.className.add = state.posts.ar
      listItemButton.id = 'showModalBtn';
      listItemButton.textContent = i18n.t('postsPreview');
      listItemButton.setAttribute('data-id', itemData.id)

      listItem.appendChild(listItemLink);
      listItem.appendChild(listItemButton);
      listGroup.appendChild(listItem);
    });

    postsContainer.appendChild(postsContainerBody);
    postsContainer.appendChild(listGroup);
    elements.posts.appendChild(postsContainer);

  }
  console.log("state.posts.title", state.posts.title );

  const buildFeedContainer = () => {
    const feedsContainer = document.createElement('div');
    feedsContainer.className = 'card border-0';
    const feedsContainerBody = document.createElement('div');
    feedsContainerBody.className = 'card-body';
    const feedsHeader = document.createElement('h2');
    feedsHeader.className = 'card-title h4';
    feedsHeader.innerHTML = i18n.t('feedsHeader');
    feedsContainerBody.appendChild(feedsHeader);
    feedsContainer.appendChild(feedsContainerBody);
    return feedsContainer
  }

  const renderFeeds = (state) => {
    const feedsFragment = new DocumentFragment();
    const feedsContainer = buildFeedContainer()

    feedsFragment.appendChild(feedsContainer);
    elements.feeds.innerHTML = '';

    state.feeds.forEach((feedItem) => {

      const listGroup = document.createElement('ul');
      listGroup.className = 'list-group border-0 rounded-0';

      const listItem = document.createElement('li');
      listItem.className = 'list-group-item border-0 border-end-0';
      const listItemTitle = document.createElement('h3');
      listItemTitle.className = 'h6 m-0';
      listItemTitle.textContent = feedItem.title;
      const listItemDescription = document.createElement('p');
      listItemDescription.className = 'm-0 small text-black-50';
      listItemDescription.textContent = feedItem.description;

      listItem.appendChild(listItemTitle);
      listItem.appendChild(listItemDescription);
      listGroup.appendChild(listItem);
      feedsContainer.appendChild(listGroup);
    })
    elements.feeds.appendChild(feedsFragment);

  }

  // const buildModalContainer = () => {
  //   const modalContent = document.createElement("div");
  //   modalContent.className = "modal-content";

  //   const modalHeader = document.createElement("div");
  //   modalHeader.className = "modal-header";

  //   const modalTitle = document.createElement("h5");
  //   modalTitle.className = "modal-title";
  //   // ? how to assing the value of the POSTS to the modal title ?
  //   // modalTitle.textContent = elements.posts.childNodes.listItemTitle.innerText;

  //   const closeButton = document.createElement("button");
  //   closeButton.type = "button";
  //   closeButton.className = "btn-close close";
  //   closeButton.setAttribute("data-bs-dismiss", "modal");
  //   closeButton.setAttribute("aria-label", "Close");

  //   modalHeader.appendChild(modalTitle);
  //   modalHeader.appendChild(closeButton);

  //   const modalBody = document.createElement("div");
  //   modalBody.className = "modal-body text-break";
  // };

  const renderModal = (state) => {
    const modal = new Modal(elements.modal);

    elements.modal.querySelector('.modal-title').textContent = state.posts.title;
    elements.modal.querySelector('.modal-body').textContent = state.posts.body;

    modal.show();
  };

  // Controller
  elements.rssForm?.addEventListener('submit', (e) => {
    e.preventDefault();


    state.form.error = '';
    state.form.state = 'filling';
    // @ts-ignore
    // const urlValue = e.target?.value.trim();
    const formData = new FormData(elements.rssForm);
    const urlValue = formData.get('url').trim();

    validate(urlValue, state.urls)
      .then(() => {
        state.urls.push(urlValue);
        state.form.url = urlValue;
        state.form.state = 'valid';

        getRssFeed(urlValue)
          .then(parseRssLink)
          .then((data) => {
            // console.log("data", data)
            // console.log('data.FeedTitle', data.feedTitle);
            // console.log('data.feedDescription', data.feedDescription);

            state.feeds.push({ title: data.title, description: data.description, link: urlValue })
            // console.log("...data.items", ...data.items);
            // console.log("...data.items.map(item => ({...item, id: _.unieqId() })", ...data.items.map(item => ({...item, id: _.unieqId() })));
            state.posts.push(...data.items.map(item => ({...item, id: _.uniqueId() })));
            
          })
          .catch((e) => {
            state.form.error = e.message;
            state.form.state = 'error'
          })

      })
      .catch((e) => {
        state.form.error = e.message;
        state.form.state = 'error';
      })
    e.value = "";
  })

  console.log("state.posts", state.posts);
  
  elements.posts?.addEventListener('click', (click) => {
    click.preventDefault;

    const postTitle = document.querySelector('.postTitle')
    console.log("postTitle", postTitle);
    postTitle.classList.remove('fw-bold');
    postTitle.classList.add('fw-normal');
  })

  elements.posts?.addEventListener('click', (click) => {
    click.preventDefault;

    // state.modal.title = "MODAL title";
    // state.modal.body = "MODAL content";

    renderModal(state);
  })  

};


/*
? why error not generated immediately once I start typing
- on submit or input
- test links for rss 
   https://lorem-rss.hexlet.app/feed?unit=second&interval=30
   http://rss.cnn.com/rss/cnn_topstories.rss
   https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml
   https://rss.nytimes.com/services/xml/rss/nyt/Science.xml
   https://lifehacker.com/rss

- 
*/