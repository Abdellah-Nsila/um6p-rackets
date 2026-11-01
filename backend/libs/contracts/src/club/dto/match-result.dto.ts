import { 
  IsInt, 
  Min, 
  Validate, 
  ValidationArguments, 
  ValidatorConstraint, 
  ValidatorConstraintInterface 
} from 'class-validator';

@ValidatorConstraint({ name: 'isNotEqual', async: false })
export class IsNotEqualConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const relatedPropertyName = args.constraints[0];
    const relatedValue = (args.object as any)[relatedPropertyName];
    
    return value !== relatedValue; 
  }

  defaultMessage(args: ValidationArguments) {
    return `Scores cannot be tied. ${args.property} must not equal ${args.constraints[0]}.`;
  }
}

export class MatchResultDto {
  @IsInt() 
  @Min(0)
  team1_score: number;

  @IsInt() 
  @Min(0)
  @Validate(IsNotEqualConstraint, ['team1_score'], {
    message: 'Matches must have a clear winner. Scores cannot be equal.',
  })
  team2_score: number;
}