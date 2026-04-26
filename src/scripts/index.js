/*
  Файл index.js является точкой входа в наше приложение
  и только он должен содержать логику инициализации нашего приложения
  используя при этом импорты из других файлов

  Из index.js не допускается что-то экспортировать
*/

import { createCardElement, likeCard } from "./components/card.js";
import {
  openModalWindow,
  closeModalWindow,
  setCloseModalWindowEventListeners,
} from "./components/modal.js";
import { enableValidation, clearValidation } from "./components/validation.js";
import {
  getUserInfo,
  getCardList,
  setUserInfo,
  setAvatar,
  addCard,
  deleteCardRequest,
} from "./components/api.js";

// Валидация
const validationSettings = {
  formSelector: ".popup__form",
  inputSelector: ".popup__input",
  submitButtonSelector: ".popup__button",
  inactiveButtonClass: "popup__button_disabled",
  inputErrorClass: "popup__input_type_error",
  errorClass: "popup__error_visible",
};

enableValidation(validationSettings);

// DOM узлы
const placesWrap = document.querySelector(".places__list");
const profileFormModalWindow = document.querySelector(".popup_type_edit");
const profileForm = profileFormModalWindow.querySelector(".popup__form");
const profileTitleInput = profileForm.querySelector(".popup__input_type_name");
const profileDescriptionInput = profileForm.querySelector(
  ".popup__input_type_description",
);

const cardFormModalWindow = document.querySelector(".popup_type_new-card");
const cardForm = cardFormModalWindow.querySelector(".popup__form");
const cardNameInput = cardForm.querySelector(".popup__input_type_card-name");
const cardLinkInput = cardForm.querySelector(".popup__input_type_url");

const imageModalWindow = document.querySelector(".popup_type_image");
const imageElement = imageModalWindow.querySelector(".popup__image");
const imageCaption = imageModalWindow.querySelector(".popup__caption");

const openProfileFormButton = document.querySelector(".profile__edit-button");
const openCardFormButton = document.querySelector(".profile__add-button");

const profileTitle = document.querySelector(".profile__title");
const profileDescription = document.querySelector(".profile__description");
const profileAvatar = document.querySelector(".profile__image");

const avatarFormModalWindow = document.querySelector(".popup_type_edit-avatar");
const avatarForm = avatarFormModalWindow.querySelector(".popup__form");
const avatarInput = avatarForm.querySelector(".popup__input");

const removeCardPopup = document.querySelector(".popup_type_remove-card");
const removeCardForm = removeCardPopup.querySelector(".popup__form");

const cardInfoModal = document.querySelector(".popup_type_info");
const cardInfoTitle = cardInfoModal.querySelector(".popup__title");
const cardInfoSubtitle = cardInfoModal.querySelector(".popup__text");
const cardInfoInfoList = cardInfoModal.querySelector(".popup__info");
const cardInfoUserList = cardInfoModal.querySelector(".popup__list");

const logoElement = document.querySelector(".logo");

// Данные пользователя
let currentUser = null;
let cardToDelete = null;
let cardIdToDelete = null;

const renderLoading = (button, isLoading, text = "Сохранение...") => {
  if (isLoading) {
    button.dataset.originalText = button.textContent;
    button.textContent = text;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalText;
    button.disabled = false;
  }
};

const handlePreviewPicture = ({ name, link }) => {
  imageElement.src = link;
  imageElement.alt = name;
  imageCaption.textContent = name;
  openModalWindow(imageModalWindow);
};

const handleProfileFormSubmit = (evt) => {
  evt.preventDefault();

  const submitButton = profileForm.querySelector(".popup__button");

  renderLoading(submitButton, true);

  setUserInfo({
    name: profileTitleInput.value,
    about: profileDescriptionInput.value,
  })
    .then((userData) => {
      profileTitle.textContent = userData.name;
      profileDescription.textContent = userData.about;
      closeModalWindow(profileFormModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      renderLoading(submitButton, false);
    });
};

const handleAvatarFormSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = avatarForm.querySelector(".popup__button");

  renderLoading(submitButton, true);

  setAvatar({
    avatar: avatarInput.value,
  })
    .then((userData) => {
      profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
      closeModalWindow(avatarFormModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      renderLoading(submitButton, false);
    });
};

const handleCardFormSubmit = (evt) => {
  evt.preventDefault();

  const submitButton = cardForm.querySelector(".popup__button");

  renderLoading(submitButton, true, "Создание...");

  addCard({
    name: cardNameInput.value,
    link: cardLinkInput.value,
  })
    .then((cardData) => {
      placesWrap.prepend(
        createCardElement(
          cardData,
          {
            onPreviewPicture: handlePreviewPicture,
            onLikeIcon: likeCard,
            onDeleteCard: handleDeleteCard,
          },
          currentUser._id,
        ),
      );
      closeModalWindow(cardFormModalWindow);
    })
    .catch((err) => {
      console.log(err);
    })
    .finally(() => {
      renderLoading(submitButton, false);
    });
};

const handleRemoveCardSubmit = (evt) => {
  evt.preventDefault();

  const submitButton = removeCardForm.querySelector(".popup__button");

  renderLoading(submitButton, true, "Удаление...");

  deleteCardRequest(cardIdToDelete)
    .then(() => {
      cardToDelete.remove();
      closeModalWindow(removeCardPopup);
      cardToDelete = null;
      cardIdToDelete = null;
    })
    .catch((err) => console.log(err))
    .finally(() => {
      renderLoading(submitButton, false);
    });
};

const handleDeleteCard = (cardElement, cardId) => {
  cardToDelete = cardElement;
  cardIdToDelete = cardId;
  openModalWindow(removeCardPopup);
};

const createUsersLike = (user) => {
  const template = document.getElementById("popup-info-user-preview-template");
  const clone = template.content.cloneNode(true);
  const listLikes = clone.querySelector(".popup__list-item");
  listLikes.textContent = user.name;
  return clone;
};

const createInfoDefinition = (label, value) => {
  const template = document.getElementById("popup-info-definition-template");
  const clone = template.content.cloneNode(true);
  clone.querySelector(".popup__info-term").textContent = label;
  clone.querySelector(".popup__info-description").textContent = value;
  return clone;
};

const handleStatsClick = () => {
  cardInfoInfoList.textContent = "";
  cardInfoUserList.textContent = "";

  getCardList()
    .then((cards) => {
      const totalUsers = new Set(cards.map((c) => c.owner._id)).size;

      const totalLikes = cards.reduce(
        (sum, card) => sum + card.likes.length,
        0,
      );

      let maxLikes = 0;
      let topUser = null;

      cards.forEach((card) => {
        if (card.likes.length > maxLikes) {
          maxLikes = card.likes.length;
          topUser = card.owner.name;
        }
      });

      cardInfoTitle.textContent = "Статистика карточек";
      cardInfoSubtitle.textContent = "Популярные карточки:";

      cardInfoInfoList.append(
        createInfoDefinition("Всего пользователей:", totalUsers),
        createInfoDefinition("Всего лайков:", totalLikes),
        createInfoDefinition("Максимально лайков:", maxLikes),
        createInfoDefinition("Чемпион лайков:", topUser || "—"),
      );

      const popularCards = [...cards]
        .sort((a, b) => b.likes.length - a.likes.length)
        .slice(0, 3);

      popularCards.forEach((card) => {
        cardInfoUserList.append(createUsersLike({ name: card.name }));
      });

      openModalWindow(cardInfoModal);
    })
    .catch((err) => console.error(err));
};

// EventListeners
profileForm.addEventListener("submit", handleProfileFormSubmit);
cardForm.addEventListener("submit", handleCardFormSubmit);
avatarForm.addEventListener("submit", handleAvatarFormSubmit);
removeCardForm.addEventListener("submit", handleRemoveCardSubmit);
logoElement.addEventListener("click", handleStatsClick);

openProfileFormButton.addEventListener("click", () => {
  profileTitleInput.value = profileTitle.textContent;
  profileDescriptionInput.value = profileDescription.textContent;

  clearValidation(profileForm, validationSettings);
  openModalWindow(profileFormModalWindow);
});

profileAvatar.addEventListener("click", () => {
  avatarForm.reset();
  clearValidation(avatarForm, validationSettings);
  openModalWindow(avatarFormModalWindow);
});

openCardFormButton.addEventListener("click", () => {
  cardForm.reset();
  clearValidation(cardForm, validationSettings);
  openModalWindow(cardFormModalWindow);
});

// настраиваем обработчики закрытия попапов
const allPopups = document.querySelectorAll(".popup");
allPopups.forEach((popup) => {
  setCloseModalWindowEventListeners(popup);
});

Promise.all([getCardList(), getUserInfo()])
  .then(([cards, userData]) => {
    currentUser = userData;
    profileTitle.textContent = userData.name;
    profileDescription.textContent = userData.about;
    profileAvatar.style.backgroundImage = `url(${userData.avatar})`;

    cards.forEach((card) => {
      placesWrap.append(
        createCardElement(
          card,
          {
            onPreviewPicture: handlePreviewPicture,
            onLikeIcon: likeCard,
            onDeleteCard: handleDeleteCard,
          },
          userData._id,
        ),
      );
    });
  })
  .catch((err) => console.error(err));
