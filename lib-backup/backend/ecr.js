"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ECR = void 0;
const cdk = require("aws-cdk-lib");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const constructs_1 = require("constructs");
class ECR extends constructs_1.Construct {
    constructor(scope, id, stage) {
        super(scope, id);
        this.ecr_repository = new aws_cdk_lib_1.aws_ecr.Repository(this, 'ecr-repository', {
            repositoryName: `${stage}-archimedes-backend-ecr-repository`,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            emptyOnDelete: true
        });
    }
}
exports.ECR = ECR;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWNyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZWNyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUFtQztBQUNuQyw2Q0FBNkM7QUFDN0MsMkNBQXVDO0FBRXZDLE1BQWEsR0FBSSxTQUFRLHNCQUFTO0lBRzlCLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBYTtRQUNuRCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRWpCLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxxQkFBRyxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLEVBQUU7WUFDN0QsY0FBYyxFQUFFLEdBQUcsS0FBSyxvQ0FBb0M7WUFDNUQsYUFBYSxFQUFFLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTztZQUN4QyxhQUFhLEVBQUUsSUFBSTtTQUN0QixDQUFDLENBQUM7SUFDUCxDQUFDO0NBQ0o7QUFaRCxrQkFZQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBhd3NfZWNyIGFzIGVjciB9IGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG5leHBvcnQgY2xhc3MgRUNSIGV4dGVuZHMgQ29uc3RydWN0IHtcbiAgICBwdWJsaWMgcmVhZG9ubHkgZWNyX3JlcG9zaXRvcnk6IGVjci5SZXBvc2l0b3J5O1xuXG4gICAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgc3RhZ2U6IHN0cmluZykge1xuICAgICAgICBzdXBlcihzY29wZSwgaWQpOyAgIFxuXG4gICAgICAgIHRoaXMuZWNyX3JlcG9zaXRvcnkgPSBuZXcgZWNyLlJlcG9zaXRvcnkodGhpcywgJ2Vjci1yZXBvc2l0b3J5Jywge1xuICAgICAgICAgICAgcmVwb3NpdG9yeU5hbWU6IGAke3N0YWdlfS1hcmNoaW1lZGVzLWJhY2tlbmQtZWNyLXJlcG9zaXRvcnlgLFxuICAgICAgICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgICAgICAgIGVtcHR5T25EZWxldGU6IHRydWVcbiAgICAgICAgfSk7XG4gICAgfVxufSJdfQ==