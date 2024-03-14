<div
    x-data="editorInstance('data', '{{ $editorId }}', {{ $readOnly ? 'true' : 'false' }}, '{{ $placeholder }}', '{{ $logLevel }}')"
    x-init="initEditor()"
    class="{{ $class }}"
    style="{{ $style }}"
    wire:ignore
    wire:key='{{ $editorId }}'
>
    <div id="{{ $editorId }}"></div>
</div>
