# static/Makefile (Will be copied to the root direcory of dist)

.DEFAULT_GOAL := help


.PHONY: help
help:
	@fgrep -h "##" $(MAKEFILE_LIST) | fgrep -v fgrep | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'


.PHONY: regress
regress: ## Delete git history and upload blog webpages to server
	# Taken from `https://stackoverflow.com/questions/9683279/make-the-current-commit-the-only-initial-commit-in-a-git-repository`
	git checkout --orphan tmp
	git add -A
	git commit -m "auto: rebase: `date +'%Y-%m-%d %H:%M:%S'`"
	git branch -D main
	git branch -M main
	git push -f origin main
	git gc --aggressive --prune=all


.PHONY: up
up: ## Upload blog webpages to server
	git add -A
	git commit -m "auto: up: `date +'%Y-%m-%d %H:%M:%S'`"
	git push origin main

