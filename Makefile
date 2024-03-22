# Define the path to the JSON file
JSON_FILE := output.json
STACK_NAME := EdaExampleStack

BASTION=$(shell jq -r '.EdaExampleStack.bastionOutput' $(JSON_FILE))
# Define targets
.PHONY: print deploy clean

print:
	@echo "Bastion public IP: $(BASTION)"
	@echo "Runner private IP: 10.19.0.99"
	@echo "Compute private IP: 10.19.0.86"

deploy:
	@echo "Deploy stack: $(STACK_NAME)"
	cdk deploy $(STACK_NAME) --require-approval never  -O $(JSON_FILE)
	@echo "Stack deployed at $(date +`%H:%M`)"

clean:
	@echo "Cleaning stack: $(STACK_NAME)"
	cdk destroy $(STACK_NAME) --force
	@echo "Stack destroyed at $(date +`%H:%M`)"
