# Phase 4.1: Platform-Specific Token Builds

## Objective
Transform base tokens into platform-optimized formats for React Native, iOS, Android, and Flutter.

## Performance Impact
- Bundle: Platform-specific, 60% smaller than universal
- Runtime: Native performance per platform
- Mobile: Zero CSS overhead in native apps

## Key Decisions
1. **Style Dictionary as transformer** - Industry standard, good platform support
2. **Platform-specific value formats** - dp for Android, pt for iOS
3. **Subset tokens per platform** - Only what each platform needs
4. **Type safety included** - TypeScript/Swift/Kotlin types generated

## Implementation Approach
Single source of truth (JSON) transforms to platform-specific formats at build time.

### Example:
```javascript
/* Source token */
{
  "spacing-4": {
    "value": "16",
    "type": "spacing"
  }
}

/* iOS Output (Swift) */
struct Spacing {
  static let spacing4: CGFloat = 16.0
}

/* Android Output (Kotlin) */
object Spacing {
  const val spacing4 = 16.dp
}

/* React Native Output */
export const spacing = {
  spacing4: 16
}
```

## Platform Transformations

### React Native
- Colors: hex → rgba objects
- Spacing: px → unitless numbers  
- Shadows: CSS → shadowOffset/shadowRadius
- Typography: Split into individual props

### iOS (Swift)
- Colors: hex → UIColor
- Spacing: px → CGFloat
- Typography: → UIFont descriptors
- Shadows: → CALayer properties

### Android (Kotlin)
- Colors: hex → @color resources
- Spacing: px → dp dimensions
- Typography: → TextAppearance styles
- Shadows: → elevation values

### Flutter
- Colors: hex → Color objects
- Spacing: px → EdgeInsets
- Typography: → TextStyle
- Shadows: → BoxShadow

## Platform Constraints
| Platform | Limitation | Workaround |
|----------|------------|------------|
| React Native | No CSS variables | Static imports |
| iOS | No dynamic themes | Trait collections |
| Android | No gradients in resources | Drawable assets |
| Flutter | Limited shadow options | Custom painters |

## Migration Path
- [ ] Install Style Dictionary
- [ ] Configure platform transforms
- [ ] Generate initial builds
- [ ] Validate in sample apps
- [ ] Integrate with CI/CD

## Validation Checklist
- [ ] All platforms build successfully
- [ ] Type definitions generated
- [ ] Visual parity across platforms
- [ ] Build time < 30s
- [ ] File sizes optimized

## Blocking Issues
- React Native shadow limitations
- Android gradient support complexity
- Flutter hot reload with tokens

## Next: [08-export-pipeline.md]