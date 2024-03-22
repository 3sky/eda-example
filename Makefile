# Define the path to the JSON file
JSON_FILE := output.json
STACK_NAME := EdaExampleStack

# Parse JSON data
BASTION := $(shell jq -r '.EdaExampleStack.bastion' $(JSON_FILE))


# Define targets
.PHONY: print deploy clean

print:
	@echo "Bastion public IP: $(BASTION)"
	@echo "Runner private IP: 10.19.0.111"
	@echo "Compute private IP: 10.19.0.90"

deploy:
	@echo "Deploy stack: $(STACK_NAME)"
	cdk deploy $(STACK_NAME) --require-approval never  -O $(JSON_FILE)
	date +%s > time.log
	@echo "Stack deployed at $(date +`%H:%M`)"

clean:
	@echo "Cleaning stack: $(STACK_NAME)"
	cdk destroy $(STACK_NAME) --force
	@echo "Stack destroyed at $(date +`%H:%M`)"
	@start_time=$$(cat time.log);
    end_time=$$(date +%s);
    time_difference=$$(( (end_time - start_time) / 60 ));
    echo "Time difference: $$time_difference minutes"
