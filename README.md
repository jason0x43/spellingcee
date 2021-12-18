# SpellingCee

A clone of the [NYT Spelling Bee](https://www.nytimes.com/puzzles/spelling-bee)
game with some additional features (eventually).

## Getting started

1. Clone this repo
2. `./spellingcee`

To enable dictionary support (for word lookups), see
[Dictionary lookups](#dictionary-lookups).

## Game IDs

Games are identified by IDs. A game ID is a string of 7 lowercase alphabetic
characters, where the first character is the “center” letter, and the other 6
letters are in alphabetical order, e.g. `icerotu`.

## Games

Every player will be presented with the same initial game on a given day.
Players may start a new game at any point. When a player opens SpellingCee on a
given machine, they will be presented with the most recently active game.
Players can access past games via a dropdown.

## Dictionary lookups

If dictionary support is enabled, clicking a guessed word will retrieve its
definition from the Merriam-Webster online dictionary and display it. To enable
dictionary support, add a `.env.local` file to your local repository containing
an API key, like:

```sh
SC_DICTIONARY_API_KEY="12345678-abcd-1234-12ab-1234abcd1234"
```

This file should **not** be committed to the repository.

To get an API key, visit the Merriam-Webster
[Developer Center](https://dictionaryapi.com/register/index) and create a new
developer account. Request a key for the Collegiate Dictionary. Only one key is
needed. The application info (name, URL, description, launch date) is required
but is not important.

Once you have created the `.env.local` file, stop and restart the development
server.

## Database schema

```js
{
	// User profiles, readable by everyone
	"users": {
		[userId]: {
			"name": string,
			"userId": string
		}
	},

	"user_games": {
		// User games, readable by the owning user. New games may be added by
		// any user.
		[userId]: {
			[gameId]: [creating user ID]
		}
	},

	"game_meta": {
		// Readable by associated users. May only be created, not updated.
		[gameId]: {
			key: string;
		}
	},

	"game_users": {
		// Readable and writable by associated users. Records may only be
		// created, not updated.
		[gameId]: {
			[userId]: 'creator' | 'other'
		}
	},

	"game_words": {
		// Readable and writable by associated users. Records may only be
		// created, not updated.
		[gameId]: {
			[word]: {
				addedAt: number;
				addedBy: string;
			}
		}
	}
}
```
