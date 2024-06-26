// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {memo, useCallback, useMemo, useEffect} from 'react';
import {useDispatch} from 'react-redux';

import type {Channel} from '@mattermost/types/channels';
import type {Post} from '@mattermost/types/posts';
import type {UserThread, UserThreadSynthetic} from '@mattermost/types/threads';
import type {UserProfile, UserStatus} from '@mattermost/types/users';

import {getPost} from 'mattermost-redux/actions/posts';

import {makeOnSubmit} from 'actions/views/create_comment';
import {removeDraft} from 'actions/views/drafts';
import {selectPost} from 'actions/views/rhs';

import type {PostDraft} from 'types/store/draft';

import DraftActions from '../draft_actions';
import DraftTitle from '../draft_title';
import Panel from '../panel/panel';
import PanelBody from '../panel/panel_body';
import Header from '../panel/panel_header';

type Props = {
    channel?: Channel;
    displayName: string;
    draftId: string;
    rootId: UserThread['id'] | UserThreadSynthetic['id'];
    status: UserStatus['status'];
    thread?: UserThread | UserThreadSynthetic;
    type: 'channel' | 'thread';
    user: UserProfile;
    value: PostDraft;
    isRemote?: boolean;
}

function ThreadDraft({
    channel,
    displayName,
    draftId,
    rootId,
    status,
    thread,
    type,
    user,
    value,
    isRemote,
}: Props) {
    const dispatch = useDispatch();

    useEffect(() => {
        if (!thread?.id) {
            dispatch(getPost(rootId));
        }
    }, [thread?.id]);

    const onSubmit = useMemo(() => {
        if (thread?.id) {
            return makeOnSubmit(value.channelId, thread.id, '');
        }

        return () => Promise.resolve({data: true});
    }, [value.channelId, thread?.id]);

    const handleOnDelete = useCallback((id: string) => {
        dispatch(removeDraft(id, value.channelId, rootId));
    }, [value.channelId, rootId, dispatch]);

    const handleOnEdit = useCallback(() => {
        dispatch(selectPost({id: rootId, channel_id: value.channelId} as Post));
    }, [value.channelId, dispatch, rootId]);

    const handleOnSend = useCallback(async (id: string) => {
        await dispatch(onSubmit(value));

        handleOnDelete(id);
        handleOnEdit();
    }, [value, onSubmit, dispatch, handleOnDelete, handleOnEdit]);

    if (!thread || !channel) {
        return null;
    }

    return (
        <Panel onClick={handleOnEdit}>
            {({hover}) => (
                <>
                    <Header
                        hover={hover}
                        actions={(
                            <DraftActions
                                channelDisplayName={channel.display_name}
                                channelName={channel.name}
                                channelType={channel.type}
                                userId={user.id}
                                draftId={draftId}
                                onDelete={handleOnDelete}
                                onEdit={handleOnEdit}
                                onSend={handleOnSend}
                            />
                        )}
                        title={(
                            <DraftTitle
                                type={type}
                                channel={channel}
                                userId={user.id}
                            />
                        )}
                        timestamp={value.updateAt}
                        remote={isRemote || false}
                    />
                    <PanelBody
                        channelId={channel.id}
                        displayName={displayName}
                        fileInfos={value.fileInfos}
                        message={value.message}
                        status={status}
                        uploadsInProgress={value.uploadsInProgress}
                        userId={user.id}
                        username={user.username}
                    />
                </>
            )}
        </Panel>
    );
}

export default memo(ThreadDraft);
