import * as cdk from 'aws-cdk-lib';
import * as BackendStack from '../lib/backend/component';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new BackendStack.BackendStack(app, 'MyTestStack');
    // THEN
    const actual = app.synth().getStackArtifact(stack.artifactId).template;
    expect(actual.Resources ?? {}).toEqual({});
});
