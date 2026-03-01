"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoDb = void 0;
const cdk = require("aws-cdk-lib");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const constructs_1 = require("constructs");
class DynamoDb extends constructs_1.Construct {
    constructor(scope, id, stage) {
        super(scope, id);
        let dynamodb_table = new aws_cdk_lib_1.aws_dynamodb.Table(this, 'data-table', {
            partitionKey: {
                name: 'pk',
                type: aws_cdk_lib_1.aws_dynamodb.AttributeType.STRING
            },
            sortKey: {
                name: 'sk',
                type: aws_cdk_lib_1.aws_dynamodb.AttributeType.STRING
            },
            tableName: `${stage}-archimedes-table`,
            billingMode: aws_cdk_lib_1.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
        // add global secondary indexes
        dynamodb_table.addGlobalSecondaryIndex({
            indexName: 'gsi1',
            partitionKey: { name: 'gsi1pk', type: aws_cdk_lib_1.aws_dynamodb.AttributeType.STRING },
            sortKey: { name: 'gsi1sk', type: aws_cdk_lib_1.aws_dynamodb.AttributeType.STRING },
            projectionType: aws_cdk_lib_1.aws_dynamodb.ProjectionType.ALL,
        });
        dynamodb_table.addGlobalSecondaryIndex({
            indexName: 'gsi2',
            partitionKey: { name: 'gsi2pk', type: aws_cdk_lib_1.aws_dynamodb.AttributeType.STRING },
            sortKey: { name: 'gsi2sk', type: aws_cdk_lib_1.aws_dynamodb.AttributeType.STRING },
            projectionType: aws_cdk_lib_1.aws_dynamodb.ProjectionType.ALL,
        });
    }
}
exports.DynamoDb = DynamoDb;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHluYW1vZGIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkeW5hbW9kYi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBbUM7QUFDbkMsNkNBQXNFO0FBQ3RFLDJDQUF1QztBQUV2QyxNQUFhLFFBQVMsU0FBUSxzQkFBUztJQUNuQyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQWE7UUFDckQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVqQixJQUFJLGNBQWMsR0FBRyxJQUFJLDBCQUFRLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUU7WUFDMUQsWUFBWSxFQUFFO2dCQUNaLElBQUksRUFBRSxJQUFJO2dCQUNWLElBQUksRUFBRSwwQkFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNO2FBQ3BDO1lBQ0QsT0FBTyxFQUFFO2dCQUNQLElBQUksRUFBRSxJQUFJO2dCQUNWLElBQUksRUFBRSwwQkFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNO2FBQ3BDO1lBQ0QsU0FBUyxFQUFFLEdBQUcsS0FBSyxtQkFBbUI7WUFDdEMsV0FBVyxFQUFFLDBCQUFRLENBQUMsV0FBVyxDQUFDLGVBQWU7WUFDakQsYUFBYSxFQUFFLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTztTQUN6QyxDQUFDLENBQUM7UUFFSCwrQkFBK0I7UUFDL0IsY0FBYyxDQUFDLHVCQUF1QixDQUFDO1lBQ3JDLFNBQVMsRUFBRSxNQUFNO1lBQ2pCLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLDBCQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUNyRSxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSwwQkFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDaEUsY0FBYyxFQUFFLDBCQUFRLENBQUMsY0FBYyxDQUFDLEdBQUc7U0FDNUMsQ0FBQyxDQUFDO1FBRUgsY0FBYyxDQUFDLHVCQUF1QixDQUFDO1lBQ3JDLFNBQVMsRUFBRSxNQUFNO1lBQ2pCLFlBQVksRUFBRSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLDBCQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUNyRSxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSwwQkFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDaEUsY0FBYyxFQUFFLDBCQUFRLENBQUMsY0FBYyxDQUFDLEdBQUc7U0FDNUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUNGO0FBakNELDRCQWlDQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBSZW1vdmFsUG9saWN5LCBhd3NfZHluYW1vZGIgYXMgZHluYW1vZGIgfSBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcblxuZXhwb3J0IGNsYXNzIER5bmFtb0RiIGV4dGVuZHMgQ29uc3RydWN0IHtcbiAgICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBzdGFnZTogc3RyaW5nKSB7XG4gICAgICBzdXBlcihzY29wZSwgaWQpO1xuICAgICAgXG4gICAgICBsZXQgZHluYW1vZGJfdGFibGUgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ2RhdGEtdGFibGUnLCB7XG4gICAgICAgIHBhcnRpdGlvbktleToge1xuICAgICAgICAgIG5hbWU6ICdwaycsXG4gICAgICAgICAgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkdcbiAgICAgICAgfSxcbiAgICAgICAgc29ydEtleToge1xuICAgICAgICAgIG5hbWU6ICdzaycsXG4gICAgICAgICAgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkdcbiAgICAgICAgfSxcbiAgICAgICAgdGFibGVOYW1lOiBgJHtzdGFnZX0tYXJjaGltZWRlcy10YWJsZWAsXG4gICAgICAgIGJpbGxpbmdNb2RlOiBkeW5hbW9kYi5CaWxsaW5nTW9kZS5QQVlfUEVSX1JFUVVFU1QsXG4gICAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgICB9KTtcbiAgXG4gICAgICAvLyBhZGQgZ2xvYmFsIHNlY29uZGFyeSBpbmRleGVzXG4gICAgICBkeW5hbW9kYl90YWJsZS5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XG4gICAgICAgIGluZGV4TmFtZTogJ2dzaTEnLFxuICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2dzaTFwaycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ2dzaTFzaycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICAgIHByb2plY3Rpb25UeXBlOiBkeW5hbW9kYi5Qcm9qZWN0aW9uVHlwZS5BTEwsXG4gICAgICB9KTtcbiAgXG4gICAgICBkeW5hbW9kYl90YWJsZS5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XG4gICAgICAgIGluZGV4TmFtZTogJ2dzaTInLFxuICAgICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ2dzaTJwaycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICAgIHNvcnRLZXk6IHsgbmFtZTogJ2dzaTJzaycsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICAgIHByb2plY3Rpb25UeXBlOiBkeW5hbW9kYi5Qcm9qZWN0aW9uVHlwZS5BTEwsXG4gICAgICB9KTtcbiAgfVxufSJdfQ==